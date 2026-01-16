/**
 *
 * @param bufferAlloc the size that should be allocted for this value
 * @returns
 */

import { ComponentBufferViews } from "./ecs";

// Polyfill for Symbol.metadata if not available
if (typeof Symbol.metadata === "undefined") {
  (Symbol as any).metadata = Symbol("Symbol.metadata");
}

export enum dataType {
  string,
  int32,
  float32,
  boolean,
  float32Array,
}

export function constructor(order: number) {
  return function <This, Value>(
    target: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ) {
    const properties: any[] = (context.metadata["constructors"] as any[]) || [];

    properties[order] = context.name;
    context.metadata["constructors"] = properties;
  };
}

export function dynamic<T>(dataType: dataType, maxSize: number | null = null) {
  return function <This, Value extends T>(
    target: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ) {
    
    // Get the metadata properties from the context
    const properties: any[] = (context.metadata["properties"] as any[]) || [];

    // Get the specific property
    const propIndex = properties.findIndex((p) => p.name === context.name);

    // If the property is already defined, update it; otherwise, add a new one
    if (propIndex >= 0) {
      properties[propIndex].type = dataType;
      properties[propIndex].size = maxSize;
    } else {
      properties.push({
        name: context.name,
        type: dataType,
        size: maxSize,
      });
    }

    context.metadata["properties"] = properties;

    return target;
  };
}

export abstract class Serializable<
  T = any,
  U = Uint8Array | Float32Array | Int32Array,
> {
  abstract deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): T;

  abstract serializeTo(
    v: T | null,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void;

  abstract byteLength(value: T | null): number;
}

/**
 * Defines that the property should be stored in the component storage table, not on the dynamic stack.
 * This means that the property has to have a fixed size. You have to define the maximum size of the property.
 *
 * You cannot change the maximum size of this property at runtime.
 *
 * The component will be initialized with a given value and the rest of the max size will be padding.
 */
export const hot = {
  string: (maxSize: number) => dynamic<string>(dataType.string, maxSize),
  int32: dynamic<number>(dataType.int32, 4),
  float32: dynamic<number>(dataType.float32, 4),
  boolean: dynamic<boolean>(dataType.boolean, 1),
  /**
   * @param maxSize number of ELEMENTS in the array (not bytes)
   */
  float32Array: (maxSize: number) =>
    dynamic<Float32Array>(dataType.float32Array, maxSize * 4),
  serialized: <T extends Serializable>(type: { new (...args: any[]): T }) => {
    return function <This, Value extends T>(
      target: undefined,
      context: ClassFieldDecoratorContext<This, Value>,
    ) {
      const properties: any[] = (context.metadata["properties"] as any[]) || [];
    };
  },
};

// TODO: Implement class serialization
export function serializable(target: Function, context: ClassDecoratorContext) {
  console.log(target, context);
}

export const cold = {
  string: dynamic<string>(dataType.string, null),
  float32Array: dynamic<Float32Array>(dataType.float32Array, null),
};

// Alternative namings
export const heap = cold;
export const stack = hot;

export function namespace(ns: string) {
  return function (target: any, context: ClassDecoratorContext) {
    
    // TODO: Implement namespace logic so that you can register systems from a scene file
    return target;
  };
}

