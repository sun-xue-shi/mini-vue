import { isFunction } from '@/utils'
import { effect, type EffectFn } from './effect'

export type watchOptions = {
  immediate?: boolean
  flush?: string
}

export function watch(
  souce: Record<string, any> | (() => any),
  cb: (
    oldVal?: any,
    newVal?: any,
    onInvalidate?: (fn: () => void) => void
  ) => void,
  options?: watchOptions
) {
  let getter: () => any
  let oldVal: any
  let newVal: any
  let cleanUp: () => void

  if (isFunction(souce)) {
    getter = souce as () => any
  } else {
    getter = () => traverse(souce)
  }

  const effectFn: EffectFn = effect(() => getter, {
    lazy: true,
    scheduler: () => {
      if (options?.flush === 'post') {
        Promise.resolve().then(job)
      } else {
        job()
      }
    }
  })

  function onInvalidate(fn: () => any) {
    cleanUp = fn
  }

  const job = () => {
    newVal = effectFn()
    if (cleanUp) cleanUp()
    cb(oldVal, newVal, onInvalidate)
    oldVal = newVal
  }

  if (options?.immediate) {
    job()
  } else {
    oldVal = effectFn()
  }
}

export function traverse(value: any, seen: Set<any> = new Set()) {
  if (typeof value !== 'object' || value == null || seen.has(value)) return
  seen.add(value)

  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}
