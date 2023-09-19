const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/
export function patchProps(
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
  el: HTMLElement
) {
  if (oldProps === newProps) return
  oldProps = oldProps || {}
  newProps = newProps || {}
  for (const key in newProps) {
    if (key === 'key') {
      continue
    }
    const next = newProps[key]
    const prev = oldProps[key]
    if (next !== prev) {
      patchDomProp(prev, next, key, el)
    }
  }
  for (const key in oldProps) {
    if (newProps[key] == null) {
      patchDomProp(oldProps[key], null, key, el)
    }
  }
}

function patchDomProp(prev: any, next: any, key: string, el: HTMLElement) {
  switch (key) {
    case 'class':
      el.className = next || ''
      break
    case 'style':
      if (next == null) {
        el.removeAttribute('style')
      } else {
        for (const styleName in next) {
          el.style[styleName] = next[styleName]
        }
        if (prev) {
          for (const styleName in prev) {
            if (next[styleName] == null) {
              el.style[styleName] = ''
            }
          }
        }
      }
      break
    default:
      if (/^on[^a-z]/.test(key)) {
        const eventName = key.slice(2).toLowerCase()
        if (prev) {
          el.removeEventListener(eventName, prev)
        }
        if (next) {
          el.addEventListener(eventName, next)
        }
      } else if (domPropsRE.test(key)) {
        if (next === '' && typeof el[key] === 'boolean') {
          next = true
        }
        el[key] = next
      } else {
        if (next === false || next == null) {
          el.removeAttribute(key)
        } else {
          el.setAttribute(key, next)
        }
      }
      break
  }
}
