export type EffectFn = {
  // 调用签名
  (): any
  deps: Array<Set<EffectFn>>
  options?: Option
}

interface Option {
  lazy?: boolean
  scheduler?: (fn: EffectFn) => any
}

// 记录当前正在执行的副作用函数
let activeEffect: EffectFn

// 存储副作用函数，并 建立其与依赖的对应关系 的桶
const targetMap: WeakMap<object, Map<any, Set<EffectFn>>> = new WeakMap()

// 解决effect嵌套问题
const effectStack: Array<EffectFn> = []

export function effect(fn: () => any, options?: Option) {
  const effectFn = () => {
    clean(effectFn)

    activeEffect = effectFn
    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.deps = [] as Array<Set<EffectFn>>
  effectFn.options = options
  if (!effectFn.options?.lazy) {
    effectFn()
  }
  effectFn.scheduler = effectFn.options?.scheduler
  return effectFn
}

function clean(effectFn: EffectFn) {
  effectFn.deps?.forEach((deps) => deps.delete(effectFn))
}

export function track(target: Record<string, any>, key: any) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let deps = depsMap.get(key)
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect)
}

export function trigger(target: Record<string, any>, key: any) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  if (!deps) return
  deps.forEach((effectFn) => {
    if (effectFn.options?.scheduler) {
      // 优先执行调度函数
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}
