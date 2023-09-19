import { h } from './vnode'
import { render } from './render'
import { isString } from '@/utils'

export function createApp(rootCompontent: Record<string, any>) {
  const app = {
    mount(rootContainer: HTMLElement | string) {
      if (isString(rootContainer)) {
        if (document.querySelector(rootContainer as string)) {
          rootContainer = document.querySelector(
            rootContainer as string
          ) as HTMLElement
        } else {
          return
        }
      }
      render(h(rootCompontent, null, null), rootContainer as HTMLElement)
    }
  }
  return app
}
