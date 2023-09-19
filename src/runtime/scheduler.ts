import { EffectFn } from '@/reactivity/effect'

const jobQueue = new Set<EffectFn>()
const resolvePromise = Promise.resolve()
let isFlushing = false
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentFlushPromise = null

export function nextTick(fn: any) {
  const p = currentFlushPromise || resolvePromise
  return fn ? p.then(fn) : p
}

export function queueJob(fn: EffectFn) {
  jobQueue.add(fn)
  flushJob()
}

export function flushJob() {
  if (isFlushing) return
  isFlushing = true
  currentFlushPromise = resolvePromise
    .then(() => {
      jobQueue.forEach((fn) => fn())
    })
    .finally(() => {
      isFlushing = false
      jobQueue.clear()
      currentFlushPromise = null
    })
}
