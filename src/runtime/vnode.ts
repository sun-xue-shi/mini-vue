import { isObject, isString, isArray, isNumber } from '../utils'
import { Instance } from './component'

interface Vnode {
  props: Record<string, any> | null
  key: any
  shapeFlag: number
  anchor: HTMLElement | Text | null
}

// HTMLElementTagNameMap：元素标签名与对应元素类型的映射
export interface TypeVnode extends Vnode {
  type:
    | keyof HTMLElementTagNameMap
    | Record<string, any>
    | TextType
    | FragmentType
  children: TypeVnode[] | string | number | null
  el: HTMLElement | Text | null
  component: Record<string, any> | null
}

export interface ElementVnode extends Vnode {
  type: keyof HTMLElementTagNameMap
  children: TypeVnode[] | string | null
  el: HTMLElement | null
}

export interface ComponentVnode extends Vnode {
  type: any
  children: TypeVnode[] | string | null
  component: Instance | null
  el: HTMLElement | Text | null
}

export interface FragmentVnode extends Vnode {
  type: FragmentType
  el: Text | null
  children: TypeVnode[] | string | null
}

export interface TextVnode {
  type: TextType
  shapeFlag: number
  children: string
  el: Text | null
  anchor: HTMLElement | null
}

export type TextType = typeof Text
export type FragmentType = typeof Fragment

export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export const ShapeFlags = {
  ELEMENT: 1,
  TEXT: 1 << 1,
  FRAGMENT: 1 << 2,
  COMPONENT: 1 << 3,
  TEXT_CHILDREN: 1 << 4,
  ARRAY_CHILDREN: 1 << 5,
  CHILDREN: (1 << 4) | (1 << 5)
}

export function h(
  type:
    | keyof HTMLElementTagNameMap
    | Record<string, any>
    | TextType
    | FragmentType,
  props: Record<string, any> | null = null,
  children: TypeVnode[] | string | number | null = null
): TypeVnode {
  let shapeFlag = 0
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (type === Text) {
    shapeFlag = ShapeFlags.TEXT
  } else if (type === Fragment) {
    shapeFlag = ShapeFlags.FRAGMENT
  } else {
    shapeFlag = ShapeFlags.COMPONENT
  }

  if (isString(children) || isNumber(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
    children = String(children)
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  return {
    type,
    props,
    children,
    shapeFlag,
    el: null,
    anchor: null, // fragment专有
    key: props && (props.key != null ? props.key : null),
    component: null // 组件的instance
  }
}

export function normalizeVNode(result: any) {
  if (isArray(result)) return h(Fragment, null, result)
  if (isObject(result)) return result
  return h(Text, null, result.toString())
}
