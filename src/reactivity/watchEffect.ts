import { effect } from './effect'

export function watchEffect(
  cb: (onInvalidate?: (fn: () => void) => void) => void
) {
  let cleanUp: () => void

  function onInvalidate(fn: () => void) {
    cleanUp = fn
  }

  const effectFn = effect(() => cb(onInvalidate), {
    lazy: true,
    scheduler: () => {
      job()
    }
  })

  const job = () => {
    if (cleanUp) cleanUp()
    cb(onInvalidate)
  }

  effectFn()
}
