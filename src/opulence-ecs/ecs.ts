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
  bufferMap: BufferMap[];
  stride: number;
  id: number;
};

type BufferMap = {
  name: string;
  type: dataType;
  storage: "hot" | "cold";
  offset: number;
  byteLength: number;
  pointer: boolean;
};

export type ComponentBufferViews = {
  Uint8View: Uint8Array;
  Float32View: Float32Array;
  Int32View: Int32Array;
};

const componentPaths = ["../game_src/components", "ecs/components"];

export class ECS {
  getComponentID(componentTypes: (() => Component)[]) {
    return componentTypes.map((type) => {
      const bufferMap = this.componentRegistry.get(type.name);
      if (!bufferMap) {
        throw new Error(`Component of type ${type.name} is not registered.`);
      }
      return bufferMap.id;
    });
  }
  componentRegistry = new Map<string, ComponentEntry>();

  componentMemory: {
    buffer: ArrayBuffer;
    views: ComponentBufferViews;
    cnt: number;
  }[] = [];

  serializers = new Map<dataType, Serializable<any>>();

  constructor() {
    this.serializers.set(dataType.string, new StringSerializer());
    this.serializers.set(dataType.float32, new Float32Serializer());
    this.serializers.set(dataType.float32Array, new Float32ArraySerializer());
    this.serializers.set(dataType.int32, new Int32Serializer());
    this.serializers.set(dataType.boolean, new BooleanSerializer());

    console.log(this.componentRegistry);
  }

  async loadComponents() {
    const components = import.meta.glob(`../../game_src/components/*.ts`);

    for (const componentImport in components) {
      const module = (await components[componentImport]()) as any;
      const bm: ComponentEntry = this.createBufferMap(module.default);
      console.log(bm);

      this.createComponent(bm);
    }

    console.log(this.componentMemory);
  }

  async loadNativeComponents() {
    const components = import.meta.glob(`../ecs/components/*.ts`);

    for (const componentImport in components) {
      const module = (await components[componentImport]()) as any;
      const bm: ComponentEntry = this.createBufferMap(module.default);
      console.log(bm);

      this.createComponent(bm);
    }

    console.log(this.componentMemory);
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

  createBufferMap(module: Function): ComponentEntry {
    // Try to access metadata - it should be on the class itself
    const metadata = (module as any)[Symbol.metadata];

    let properties = metadata.properties;
    let constructors = metadata.constructors;

    console.log(constructors);

    const memoryIndex = this.componentRegistry.size;
    let stride = 0;
    const bufferMap: BufferMap[] = [];

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const ctor = constructors ? constructors[i] : null;
      const byteLength = property.size
        ? property.size + ((4 - (property.size % 4)) % 4)
        : 4;

      bufferMap.push({
        name: property.name,
        type: property.type,
        storage: property.size != null ? "hot" : "cold",
        offset: stride,
        byteLength,
        pointer: property.size == null,
        constructorBinding: ctor ? i : null,
      });

      stride += byteLength;
    }

    const value = {
      bufferMap,
      stride,
      id: memoryIndex,
    };

    this.componentRegistry.set(module.name, value);

    return value;
  }

  pushComponent<T>(component: () => T, [...constructionArgs]: any[] = []) {
    console.log(component.name);
    const bufferMap = this.componentRegistry.get(component.name);
    if (!bufferMap) {
      throw new Error(`Component of type ${component.name} is not registered.`);
    }
    const instanceId = this.componentMemory[bufferMap.id].cnt++;

    const defaultValues = new component();

    bufferMap.bufferMap.forEach((prop: BufferMap) => {
      const defaultV = defaultValues[prop.name];
      console.log(`Default for ${prop.name}:`, defaultV);
      const value = prop.constructorBinding
        ? constructionArgs[prop.constructorBinding]
        : defaultV
          ? defaultV
          : null;
      console.log(prop.name, value);

      let offset = instanceId * bufferMap.stride + prop.offset;
      console.log(`Offset for ${prop.name}: ${offset}`);

      if (value) {
        if (prop.pointer) {
          console.log(`Storing pointer for ${prop.name}`);
        } else {
          const serializer = this.serializers.get(prop.type);
          console.log(prop);
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

    console.log(this.componentMemory[bufferMap.id].buffer);
    return instanceId;
    // the class get GCed
  }

  getComponent<T>(componentType: { new (): T }, index: number): T | null {
    const bufferMap = this.componentRegistry.get(componentType.name);
    if (!bufferMap) {
      throw new Error(
        `Component of type ${componentType.name} is not registered.`,
      );
    }

    const component = new componentType();

    bufferMap.bufferMap.forEach((prop: any) => {
      let offset = index * bufferMap.stride + prop.offset;

      if (prop.pointer) {
        console.log(`Retrieving pointer for ${prop.name}`);
      } else {
        const serializer = this.serializers.get(prop.type);
        (component as any)[prop.name] = serializer.deserialize(
          this.componentMemory[bufferMap.id].views,
          offset,
          prop.byteLength,
        );
      }
      offset += prop.size;
    });

    console.log(component);
    return component;
  }
}

// const ecs = new ECS();

// const component = new TransformComponent();

// component.position = new Float32Array([1, 2, 3]);
// component.rotation = new Float32Array([0, 0, 0, 1]);
// component.scale = new Float32Array([1, 1, 1]);
// component.matrix = new Float32Array(16).fill(12312);

// console.log(ecs.componentMemory);

// ecs.pushComponent<TransformComponent>(component);

// ecs.getComponent(TransformComponent, 0);

// const mesh = new MeshComponent();

// mesh.texture = new Float32Array([0, 1, 0, 1]);
// mesh.vertices = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);

// ecs.pushComponent<MeshComponent>(mesh);

// ecs.getComponent(MeshComponent, 0);
