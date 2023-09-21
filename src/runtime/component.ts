import { reactive } from '../reactivity/reactive'
import { EffectFn, effect } from '../reactivity/effect'
import { ComponentVnode, TypeVnode, normalizeVNode } from './vnode'
import { queueJob } from './scheduler'
import { ChildVnode, TElement, patch } from './render'

export interface Instance {
  props: Record<string, any> | null //组件自己声明的prop
  attrs: Record<string, any> | null //组件接收的自身未声明的prop
  setupState: Record<string, any> | null // setup返回的数据
  ctx: Record<string, any> | null // props + setupState: 传递给组件的render函数
  update: EffectFn | null //更新组件的函数
  isMounted: boolean
  subTree: TypeVnode | null //虚拟DOM树
  next: ComponentVnode | null //存新的组件虚拟DOM
}

function updateProps(instance: Instance, vnode: ComponentVnode) {
  const { type: Compontent, props: vnodeProps } = vnode

  for (const key in vnodeProps) {
    if (Compontent.props?.includes(key)) {
      instance.props[key] = vnodeProps[key]
    } else {
      instance.attrs[key] = vnodeProps[key]
    }
  }
  instance.props = reactive(instance.props)
}

function fallThrough(instance: Instance, subTree: TypeVnode) {
  if (Object.keys(instance.attrs).length) {
    subTree.props = {
      ...instance.attrs,
      ...subTree.props
    }
  }
}

export function mountComponent(
  vnode: ComponentVnode,
  container: HTMLElement,
  anchor: TElement | ChildVnode | null = null
) {
  const { type: Component } = vnode

  const instance: Instance = (vnode.component = {
    props: {},
    attrs: {},
    setupState: null,
    ctx: null,
    update: null,
    isMounted: false,
    subTree: null,
    next: null
  })

  updateProps(instance, vnode)

  instance.setupState = Component.setup?.(instance.props, {
    attrs: instance.attrs
  })

  instance.ctx = {
    ...instance.props,
    ...instance.setupState
  }

  instance.update = effect(
    () => {
      if (!instance.isMounted) {
        instance.subTree = normalizeVNode(Component?.render(instance.ctx))
        fallThrough(instance, instance.subTree)
        patch(null, instance.subTree, container, anchor)
        instance.isMounted = true
        vnode.el = instance.subTree.el
      } else {

        if (instance.next) {
          vnode = instance.next
          instance.next = null
          updateProps(instance, vnode)
          instance.ctx = {
            ...instance.props,
            ...instance.setupState
          }
        }
        const prev = instance.subTree
        instance.subTree = normalizeVNode(Component.render(instance.ctx))
        fallThrough(instance, instance.subTree)
        patch(prev, instance.subTree, container, anchor)
        vnode.el = instance.subTree.el
      }
    },
    {
      scheduler: (fn) => queueJob(fn)
    }
  )
}
