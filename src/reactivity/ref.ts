import { hasChanged, isObject } from "../utils";
import { reactive } from "./reactive";
import { track, trigger } from "./effect";

export function ref(value: any) {
  if (isRef(value)) return value;
  return new RefImpl(value);
}

export function isRef(value: any) {
  return !!(value && value.__isRef);
}

// ref实现
class RefImpl {
  __value: any;
  __isRef: boolean;

  constructor(value: any) {
    this.__value = conver(value);
    this.__isRef = true;
  }

  get value() {
    track(this, "value");
    return this.__value;
  }

  set value(newVal: any) {
    if (hasChanged(this.__value, newVal)) {
      this.__value = conver(newVal);
      trigger(this, "value");
    }
  }
}

export function conver(value: any) {
  return isObject(value) ? reactive(value) : value;
}
