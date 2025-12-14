/**
 *
 * @param bufferAlloc the size that should be allocted for this value
 * @returns
 */

import "reflect-metadata";

export enum dataType {
  string,
  int32,
  float32,
  boolean,
  float32Array,
}

export function dynamic<T>(dataType, bufferAlloc: number) {
  return (target: T, key: string) => {
    Reflect.defineMetadata("ecs:type", "dynamic", target, key);
    Reflect.defineMetadata("ecs:max", bufferAlloc, target, key);
    const list = Reflect.getMetadata("ecs:registry", target.constructor) || [];
    list.push({ name: key, type: dataType, bufferAlloc });
    Reflect.defineMetadata("ecs:registry", list, target.constructor);

    // print the property type
    const propertyType = Reflect.getMetadata("design:type", target, key);
    const _propertyType = Reflect.getMetadata("design:paramtypes", target, key);
    console.log(`Property ${key} type: ${propertyType}`);
    console.log(_propertyType);
  };
}

export function fixed<T>(dataType: dataType) {
  return (target: T, key: string) => {
    Reflect.defineMetadata("ecs:type", "fixed", target, key);
    const list = Reflect.getMetadata("ecs:registry", target) || [];
    list.push({ name: key, type: dataType });
    Reflect.defineMetadata("ecs:registry", list, target);
  };
}

export function frequent<T>(target: T, key: string) {
  Reflect.defineMetadata("ecs:rate", "frequent", target, key);
}

export function infrequent<T>(target: T, key: string) {
  Reflect.defineMetadata("ecs:rate", "infrequent", target, key);
}

export function readonly<T>(target: T, key: string) {
  Reflect.defineMetadata("ecs:access", "readonly", target, key);
}

export function writable<T>(target: T, key: string) {
  Reflect.defineMetadata("ecs:access", "writable", target, key);
}

export function component<T>(constructor: T) {
  console.log(constructor);
  Reflect.defineMetadata("ecs:registry", [], constructor);
  console.log("Registered component:", constructor);
}
