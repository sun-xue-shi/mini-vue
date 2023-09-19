import {
  ComponentVnode,
  ElementVnode,
  FragmentVnode,
  ShapeFlags,
  TextVnode,
  TypeVnode
} from './vnode'
import { patchProps } from './patchProps'
import { mountComponent } from './component'

export interface TElement extends HTMLElement {
  _vnode?: TypeVnode | null
}
export interface ChildVnode extends ChildNode {
  _vnode?: TypeVnode | null
}

export function render(vnode: TypeVnode | null, container: TElement) {
  const prevVNode = container._vnode
  if (!vnode) {
    if (prevVNode) {
      unmount(prevVNode)
    }
  } else {
    patch(prevVNode, vnode, container)
  }
  container._vnode = vnode
}

function isSameComponent(preVnode: TypeVnode, newVnode: TypeVnode) {
  return preVnode.type === newVnode.type
}

export function patch(
  preVnode: TypeVnode | null | undefined,
  newVnode: TypeVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const { shapeFlag } = newVnode

  if (preVnode && !isSameComponent(preVnode, newVnode)) {
    anchor = (preVnode.anchor || preVnode.el).nextSibling
    unmount(preVnode)
    preVnode = null
  }

  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(
      preVnode as ElementVnode,
      newVnode as ElementVnode,
      container,
      anchor
    )
  } else if (shapeFlag & ShapeFlags.TEXT) {
    processText(preVnode as any, newVnode as any, container, anchor)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    processFragment(
      preVnode as FragmentVnode,
      newVnode as FragmentVnode,
      container,
      anchor
    )
  } else if (shapeFlag & ShapeFlags.COMPONENT) {
    processComponent(preVnode, newVnode, container, anchor)
  }
}

function mountElement(
  vnode: ElementVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const { type, props, shapeFlag, children } = vnode
  const el = (vnode.el = document.createElement(type))
  patchProps(null, props, el)
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children as string
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(children as TypeVnode[], el, null)
  }

  if (props) {
    patchProps(null, props, el)
  }

  container.insertBefore(el, anchor)
}

function mountTextNode(
  vnode: TextVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const textNode = document.createTextNode(vnode.children)
  vnode.el = textNode
  container.insertBefore(textNode, anchor)
}

function mountChildren(
  children: TypeVnode[],
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  children.forEach((child) => {
    patch(null, child, container, anchor)
  })
}

function updateComponent(preVnode: ComponentVnode, newVnode: ComponentVnode) {
  newVnode.component = preVnode.component
  newVnode.component.next = newVnode
  newVnode.component.update()
}

function unmount(vnode: TypeVnode) {
  const { shapeFlag, el } = vnode
  if (shapeFlag & ShapeFlags.COMPONENT) {
    unmountComponent(vnode as ComponentVnode)
  } else if (shapeFlag & ShapeFlags.FRAGMENT) {
    unmountFragment(vnode as FragmentVnode)
  } else {
    el.parentNode.removeChild(el)
  }
}

function unmountComponent(vnode: ComponentVnode) {
  unmount(vnode.component.subTree)
}

function unmountFragment(vnode: FragmentVnode) {
  // eslint-disable-next-line prefer-const
  let { el: cur, anchor: end } = vnode
  while (cur !== end) {
    const next = (cur as any).nextSibling
    cur.parentNode.removeChild(cur)
    cur = next
  }
  end.parentNode.removeChild(end)
}

function processElement(
  preVnode: ElementVnode | null,
  newVnode: ElementVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  if (!preVnode) {
    mountElement(newVnode, container, anchor)
  } else {
    patchElement(preVnode, newVnode)
  }
}

function processFragment(
  preVnode: FragmentVnode | null | undefined,
  newVnode: FragmentVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const fragmentStartAnchor = (newVnode.el = preVnode
    ? preVnode.el
    : document.createTextNode(''))
  const fragmentEndAnchor = (newVnode.anchor = preVnode
    ? preVnode.anchor
    : document.createTextNode(''))
  if (!preVnode) {
    container.insertBefore(fragmentStartAnchor, anchor)
    container.insertBefore(fragmentEndAnchor, anchor)
    mountChildren(
      newVnode.children as TypeVnode[],
      container,
      fragmentEndAnchor
    )
  } else {
    patchChildren(preVnode, newVnode, container, fragmentEndAnchor)
  }
}

function processText(
  preVnode: TextVnode,
  newVnode: TextVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  if (!preVnode) {
    mountTextNode(newVnode, container, anchor)
  } else {
    newVnode.el = preVnode.el
    newVnode.el.textContent = newVnode.children
  }
}

function processComponent(
  preVnode: any,
  newVnode: any,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  if (!preVnode) {
    mountComponent(newVnode, container, anchor)
  } else {
    updateComponent(preVnode, newVnode)
  }
}

function patchElement(preVnode: ElementVnode, newVnode: ElementVnode) {
  newVnode.el = preVnode.el
  patchProps(preVnode.props, newVnode.props, newVnode.el)
  patchChildren(preVnode, newVnode, newVnode.el)
}

function patchChildren(
  preVnode: ElementVnode | ComponentVnode | FragmentVnode,
  newVnode: ElementVnode | ComponentVnode | FragmentVnode,
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const { shapeFlag: prevShapeFlag, children: oldChildren } = preVnode
  const { shapeFlag: newShapFlag, children: newChildren } = newVnode

  if (newShapFlag & ShapeFlags.TEXT_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(oldChildren as TypeVnode[])
    }
    if (newChildren !== oldChildren) {
      container.textContent = newChildren as string
    }
  } else if (newShapFlag & ShapeFlags.ARRAY_CHILDREN) {
    if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      if (
        (oldChildren as TypeVnode[])[0] &&
        (oldChildren as TypeVnode[])[0].key &&
        (newChildren as TypeVnode[])[0] &&
        (newChildren as TypeVnode[])[0].key
      ) {
        patchKeyedChildren(
          oldChildren as TypeVnode[],
          newChildren as TypeVnode[],
          container,
          anchor
        )
      } else {
        patchUnkeyedChildren(
          oldChildren as TypeVnode[],
          newChildren as TypeVnode[],
          container,
          anchor
        )
      }
    } else {
      container.textContent = ''
      mountChildren(newChildren as TypeVnode[], container, anchor)
    }
  } else {
    if (newShapFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(newChildren as TypeVnode[])
    }
    container.textContent = ''
  }
}

function unmountChildren(children: TypeVnode[]) {
  children.forEach((child) => unmount(child))
}

function patchUnkeyedChildren(
  oldChildren: TypeVnode[],
  newChildren: TypeVnode[],
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  const oldLength = oldChildren.length
  const newLength = newChildren.length
  const commonLength = Math.min(oldLength, newLength)
  for (let i = 0; i < commonLength; i++) {
    patch(oldChildren[i], newChildren[i], container, anchor)
  }
  if (oldLength > newLength) {
    unmountChildren(oldChildren.slice(commonLength))
  } else if (oldLength < newLength) {
    mountChildren(newChildren.slice(commonLength), container, anchor)
  }
}

function patchKeyedChildren(
  oldChildren: TypeVnode[],
  newChildren: TypeVnode[],
  container: TElement,
  anchor: TElement | ChildVnode | null = null
) {
  let j = 0
  let oldNode = oldChildren[j]
  let newNode = newChildren[j]
  let oldEnd = oldChildren.length - 1
  let newEnd = newChildren.length - 1

  while (oldNode.key === newNode?.key) {
    patch(oldNode, newNode, container, anchor)
    j++
    oldNode = oldChildren[j]
    newNode = newChildren[j]
  }

  oldNode = oldChildren[oldEnd]
  newNode = newChildren[newEnd]

  while (oldNode.key === newNode.key) {
    patch(oldNode, newNode, container, anchor)
    oldEnd--
    newEnd--
    oldNode = oldChildren[oldEnd]
    newNode = newChildren[newEnd]
  }

  if (j <= newEnd && j > oldEnd) {
    const anchorIndex = newEnd + 1
    const anchor =
      anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null
    while (j <= newEnd) {
      patch(null, newChildren[j++], container, anchor)
    }
  } else if (j > newEnd && j <= oldEnd) {
    while (j <= oldEnd) {
      unmount(oldChildren[j++])
    }
  } else {
    const count = newEnd - j + 1
    const souce = new Array(count)
    souce.fill(-1)
    let patched = 0
    let pos = 0
    let moved = false

    const keyIndex = {}
    for (let i = j; i < newEnd; i++) {
      keyIndex[newChildren[i].key] = i
    }
    for (let i = 0; i < oldEnd; i++) {
      oldNode = oldChildren[i]
      if (patched <= count) {
        const k = keyIndex[oldNode.key]

        if (typeof k !== 'undefined') {
          newNode = newChildren[k]
          patch(oldNode, newNode, container, anchor)
          patched++
          souce[k - j] = i
          if (k < pos) {
            moved = true
          } else {
            pos = k
          }
        } else {
          unmount(oldNode)
        }
      } else {
        unmount(oldNode)
      }
    }
    if (moved) {
      const seq = getSequence(souce)

      let s = seq.length - 1
      let i = count - 1

      for (i; i >= 0; i--) {
        if (souce[i] == -1) {
          pos = i + j
          newNode = newChildren[pos]
          const nextPos = pos + 1
          anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
          patch(null, newNode, container, anchor)
        } else if (i !== seq[s]) {
          pos = i + j
          newNode = newChildren[pos]
          const nextPos = pos + 1
          anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null
          container.insertBefore(newNode.el, anchor)
        } else {
          s--
        }
      }
    }
  }
}

function getSequence(nums: any[]) {
  const result = []
  const position = []
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === -1) {
      continue
    }

    if (nums[i] > result[result.length - 1]) {
      result.push(nums[i])
      position.push(result.length - 1)
    } else {
      let l = 0,
        r = result.length - 1
      while (l <= r) {
        const mid = ~~((l + r) / 2)
        if (nums[i] > result[mid]) {
          l = mid + 1
        } else if (nums[i] < result[mid]) {
          r = mid - 1
        } else {
          l = mid
          break
        }
      }
      result[l] = nums[i]
      position.push(l)
    }
  }
  let cur = result.length - 1

  for (let i = position.length - 1; i >= 0 && cur >= 0; i--) {
    if (position[i] === cur) {
      result[cur--] = i
    }
  }
  return result
}
