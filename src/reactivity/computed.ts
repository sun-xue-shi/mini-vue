import { isFunction } from '@/utils'
import { effect, track, type EffectFn, trigger } from './effect'

type computedOptions =
  | { getter: () => any; setter: (newValue?: any) => void }
  | (() => any)

export function computed(computedOptions: computedOptions) {
  let getter: () => any
  let setter: (newVal: any) => any

  if (isFunction(computedOptions)) {
    getter = computedOptions as () => any
    setter = () => {
      console.warn('Write operation failed: computed value is readonly')
    }
  } else {
    getter = computedOptions.getter
    setter = computedOptions.setter
  }
  return new ComputedImpl(getter, setter)
}

class ComputedImpl {
  __value: any
  dirty: boolean
  effect: EffectFn
  _setter: (newVal?: any) => any

  constructor(getter: () => any, setter: (newVal?: any) => any) {
    this.__value = undefined
    this.dirty = true
    this._setter = setter
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => {
        if (!this.dirty) {
          this.dirty = true
          trigger(this, 'value')
        }
      }
    }) as EffectFn
  }

  get value() {
    if (this.dirty) {
      this.__value = this.effect() as EffectFn
      this.dirty = false
      track(this, 'value')
    }
    return this.__value
  }

  set value(newVal) {
    this._setter(newVal)
  }
}
