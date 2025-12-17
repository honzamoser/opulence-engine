import "./component-gen";
import { dataType, dynamic, serializable } from "./component-gen";
import Module from "module";
import { Allocator } from "./allocator";
import { log } from "console";
import TransformComponent from "../../game_src/components/transform";
import MeshComponent from "../../game_src/components/mesh";
import { Serializable } from "./component-gen";
import StringSerializer from "./serializers/stringSerializer";
import { Float32Serializer } from "./serializers/float32Serializer";
import { Float32ArraySerializer } from "./serializers/float32ArraySerializer";
import { Int32Serializer } from "./serializers/int32Serializer";
import { BooleanSerializer } from "./serializers/booleanSerializer";
import { Component } from "../ecs/component";

type ComponentEntry = {
  bufferMap: { [index: string]: BufferMap };
  stride: number;
  id: number;
};

type BufferMap = {
  type: dataType;
  storage: "hot" | "cold";
  offset: number;
  byteLength: number;
  pointer: boolean;
  constructorBinding: number | null;
};

export type ComponentBufferViews = {
  Uint8View: Uint8Array;
  Float32View: Float32Array;
  Int32View: Int32Array;
};

export type PropertyValues = {
  name: string;
  type: dataType;
  size?: number;
};

const componentPaths = ["../game_src/components", "ecs/components"];

export class ECS {
  componentRegistry: ClassConstructor<Component>[] = [];

  componentMemory: {
    buffer: ArrayBuffer;
    views: ComponentBufferViews;
    cnt: number;
  }[] = [];

  serializers: Serializable[] = [];

  latestId = 0;

  constructor() {
    this.serializers[dataType.string] = new StringSerializer();
    this.serializers[dataType.float32] = new Float32Serializer();
    this.serializers[dataType.float32Array] = new Float32ArraySerializer();
    this.serializers[dataType.int32] = new Int32Serializer();
    this.serializers[dataType.boolean] = new BooleanSerializer();
  }

  getComponentById(id: number) {
    return this.componentRegistry[id];
  }

  async loadComponents() {
    const components = import.meta.glob(`../../game_src/components/*.ts`);

    for (const componentImport in components) {
      const module = (await components[componentImport]()) as any;
      const bm: ComponentEntry = this.createBufferMap(module.default);
      console.log(bm);

      this.createComponent(bm);
    }
  }

  async loadNativeComponents() {
    const components = import.meta.glob(`../ecs/components/*.ts`);

    for (const componentImport in components) {
      const module = (await components[componentImport]()) as any;
      const bm: ComponentEntry = this.createBufferMap(module.default);
      console.log(bm);

      this.createComponent(bm);
    }
  }

  createComponent(buffermap: ComponentEntry) {
    const buffer = new ArrayBuffer(buffermap.stride * 64);
    return this.componentMemory.push({
      buffer,
      views: {
        Float32View: new Float32Array(buffer),
        Int32View: new Int32Array(buffer),
        Uint8View: new Uint8Array(buffer),
      },
      cnt: 0,
    });
  }

  createBufferMap(module: ClassConstructor<Component>): ComponentEntry {
    const metadata = (module as any)[Symbol.metadata];

    let properties: PropertyValues[] = metadata.properties;
    let constructors = metadata.constructors;

    const memoryIndex = this.latestId++;
    let stride = 0;

    const bufferMap: { [index: string]: BufferMap } = {};

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const ctor = constructors?.indexOf(property.name);
      const byteLength = property.size
        ? property.size + ((4 - (property.size % 4)) % 4)
        : 4;

      bufferMap[property.name] = {
        type: property.type,
        storage: property.size != null ? "hot" : "cold",
        offset: stride,
        byteLength,
        pointer: property.size == null,
        constructorBinding: ctor != -1 ? ctor : null,
      };

      stride += byteLength;
    }

    const value = {
      bufferMap,
      stride,
      id: memoryIndex,
    };

    console.log();

    module.id = memoryIndex;
    module.bufferMap = value;

    this.componentRegistry[memoryIndex] = module;

    return value;
  }

  createFieldAccessor(component: ClassConstructor<Component>, field: string) {
    const bufferMap = component.bufferMap as ComponentEntry;
    const prop = bufferMap.bufferMap[field];
    const views = this.componentMemory[bufferMap.id].views;
    const stride = bufferMap.stride;
    const offset = prop.offset;

    const deser = this.serializers[prop.type];

    return {
      get: (instanceId: number) => {
        return deser.deserialize(
          views,
          instanceId * stride + offset,
          prop.byteLength,
        );
      },
    };
  }

  createComponentAccessor<T extends Component>(component: ClassConstructor<T>) {
    const bufferMap = component.bufferMap as ComponentEntry;
    const views = this.componentMemory[bufferMap.id].views;
    const stride = bufferMap.stride;

    return {
      get: (instanceId: number, field: string) => {
        const prop = bufferMap.bufferMap[field];
        const offset = prop.offset;

        const deser = this.serializers[prop.type];

        return deser.deserialize(
          views,
          instanceId * stride + offset,
          prop.byteLength,
        );
      },
      set: (instanceId: number, field: string, value: any) => {
        const prop = bufferMap.bufferMap[field];
        const offset = prop.offset;

        const ser = this.serializers[prop.type];
        ser.serializeTo(
          value,
          views,
          instanceId * stride + offset,
          prop.byteLength,
        );
      },
    };
  }

  getComponentValue<T extends Component>(
    componentId: number,
    componentTypes: ClassConstructor<T>,
    componentField: string,
  ) {
    const bufferMap = componentTypes.bufferMap as ComponentEntry;

    const prop = bufferMap.bufferMap[componentField];
    let offset = componentId * bufferMap.stride + prop.offset;
    let length = prop.byteLength;

    const deser = this.serializers[prop.type];
    const v = deser.deserialize(
      this.componentMemory[bufferMap.id].views,
      offset,
      length,
    );

    return v;
  }

  getComponentValues<T extends Component>(
    componentId: number,
    ComponentType: ClassConstructor<T>,
  ): T {
    const bufferMap = ComponentType.bufferMap as ComponentEntry;
    const values: any = {};

    Object.entries(bufferMap.bufferMap).forEach(([fieldName, prop]) => {
      let offset = componentId * bufferMap.stride + prop.offset;
      let length = prop.byteLength;

      const deser = this.serializers[prop.type];
      const v = deser.deserialize(
        this.componentMemory[bufferMap.id].views,
        offset,
        length,
      );

      values[fieldName] = v;
    });

    return values as T;
  }

  getComponentValueSubarray<T extends Component>(
    componentId: number,
    componentTypes: ClassConstructor<T>,
    componentField: string,
  ) {
    const bufferMap = componentTypes.bufferMap as ComponentEntry;

    const prop = bufferMap.bufferMap[componentField];
    let offset = componentId * bufferMap.stride + prop.offset;
    let length = prop.byteLength;

    return this.componentMemory[bufferMap.id].views.Float32View.subarray(
      offset / 4,
      offset / 4 + length / 4,
    );
  }

  setComponentValue<T extends Component>(
    componentId: number,
    componentTypes: ClassConstructor<T>,
    componentField: string,
    value: any,
  ) {
    const bufferMap = componentTypes.bufferMap as ComponentEntry;

    const prop = bufferMap.bufferMap[componentField];
    let offset = componentId * bufferMap.stride + prop.offset;
    let length = prop.byteLength;

    const ser = this.serializers[prop.type];
    ser.serializeTo(
      value,
      this.componentMemory[bufferMap.id].views,
      offset,
      length,
    );
  }

  pushComponent<T>(
    component: ClassConstructor<T>,
    constructionArgs: ClassConstructionArguments<T>,
  ) {
    const bufferMap = component.bufferMap;
    if (!bufferMap) {
      throw new Error(`Component of type ${component.name} is not registered.`);
    }
    const instanceId = this.componentMemory[bufferMap.id].cnt++;

    const defaultValues = new component();

    Object.entries(bufferMap.bufferMap).forEach((x: [string, BufferMap]) => {
      const prop = x[1];
      const defaultV = defaultValues[x[0]];
      const value = (() => {
        if (prop.constructorBinding != null) {
          return constructionArgs[prop.constructorBinding];
        } else if (defaultV !== undefined) {
          return defaultV;
        } else {
          return null;
        }
      })();

      let offset = instanceId * bufferMap.stride + prop.offset;

      if (value) {
        if (prop.pointer) {
          throw new Error(
            "Cold storage and pointers have not been implemented yet.",
          );
        } else {
          const serializer = this.serializers[prop.type];
          serializer.serializeTo(
            value,
            this.componentMemory[bufferMap.id].views,
            offset,
            prop.byteLength,
          );
        }
      }
      offset += prop.byteLength;
    });

    return instanceId;
  }

  getComponent<T extends Component>(
    componentType: ClassConstructor<T>,
    index: number,
  ): T | null {
    const bufferMap = componentType.bufferMap;
    if (!bufferMap) {
      throw new Error(
        `Component of type ${componentType.name} is not registered.`,
      );
    }

    const component = new componentType();

    Object.entries(bufferMap.bufferMap).forEach((x: [string, BufferMap]) => {
      const prop = x[1];
      let offset = index * bufferMap.stride + prop.offset;

      console.log(prop);

      if (prop.pointer) {
        console.log(`Retrieving pointer for ${prop.name}`);
      } else {
        const serializer = this.serializers[prop.type];
        (component as any)[x[0]] = serializer.deserialize(
          this.componentMemory[bufferMap.id].views,
          offset,
          prop.byteLength,
        );
      }
      offset += prop.byteLength;
    });

    return component;
  }
}

export type ClassConstructor<T> = new (...args: any[]) => T;
export type ClassConstructionArguments<T> = ConstructorParameters<
  ClassConstructor<T>
>;
