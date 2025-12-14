import { Component } from "../ecs/component";
import {
  integer,
  is,
  ReflectionClass,
  ReflectionKind,
  typeOf,
} from "@deepkit/type";
import { PointerManager } from "./arrayBufferPointer";
import { TestComponent } from "../../game_src/components/testComponent";

// Serialize basic types to bytes
// arrays, strings and arraybuffers should be assigned to ArrayBufferPointers
// each component has to have its own bytemap
// SerDe should output this map [{propName: "test", type: "int32", length: 4}, {propName: "testString", type: "string", pointer: 523}]
//

type ClassConstructor<T> = new (...args: any[]) => T;

export class SerDe {
  bufferMaps: Map<ClassConstructor<Component>, any> = new Map();

  readonly BUFFER_VALUES = [ReflectionKind.string];

  cacheBufferMap() {}

  serialize<T>(component: T) {
    console.warn(component.constructor);
    const classConstructor = component.constructor as ClassConstructor<T>;
    let bufMap;
    if (!this.bufferMaps.has(classConstructor)) {
      bufMap = this.createBufferMap(component);
      this.bufferMaps.set(classConstructor, bufMap);
    } else {
      bufMap = this.bufferMaps.get(classConstructor);
    }

    console.log(bufMap);

    return this.serializeObjectWithBufferMap(
      component,
      bufMap.bufmap,
      bufMap.length,
    );
  }

  private serializeObjectWithBufferMap(
    val: object,
    bufferMap: any[],
    len: number,
    setBuffer?: ArrayBuffer,
    setOffset?: number,
  ) {
    let buffer: ArrayBuffer = setBuffer ? setBuffer : new ArrayBuffer(len);
    const dataView = new DataView(buffer);
    let offset = setOffset | 0;

    bufferMap.forEach((bufMapEntry) => {
      const propValue = (val as any)[bufMapEntry.propName];

      console.log(bufMapEntry);
      console.log(typeof bufMapEntry.type);

      if (typeof bufMapEntry.type === "string") {
        if (bufMapEntry.type === "number") {
          dataView.setFloat32(offset, propValue, true);
          offset += 4;
          console.log(offset);
        } else if (bufMapEntry.type === "boolean") {
          dataView.setUint8(offset, propValue ? 1 : 0);
          offset += 1;
        } else if (bufMapEntry.type === "string*") {
          dataView.setUint32(
            offset,
            PointerManager.instance.createStringPointerTo(propValue).pointerId,
          );
          offset += 4;
        } else if ((bufMapEntry.type as string).endsWith("[]*")) {
          console.log("array");
          const pointer = PointerManager.instance.createArrayPointerTo(
            propValue,
            (bufMapEntry.type as string).split("[]*")[0],
          );
          dataView.setUint32(offset, pointer.pointerId);
          console.log(offset, pointer);
          offset += 4;
        } else if (bufMapEntry.type === "ArrayBuffer*") {
          const pointer = PointerManager.instance.createPointerTo(propValue);
          dataView.setUint32(offset, pointer.pointerId);
          offset += 4;
        }
      } else {
        // nested object
        this.serializeObjectWithBufferMap(
          propValue,
          bufMapEntry.type,
          bufMapEntry.len,
          buffer,
          offset,
        );
        offset += bufMapEntry.len;
        console.log("nested object size ", bufMapEntry.len);
      }
    });

    return buffer;
  }

  private createBufferMap(value: object) {
    const rc = ReflectionClass.from<typeof value>();
    const bufferMap = [];
    let totalLength = 0;

    rc.getProperties().forEach((prop) => {
      let bufferMapping: {
        propName: string;
        type: string;
        len: number;
      } | null = null;

      if (prop.type.kind == 20) {
        if (prop.type.classType == ArrayBuffer) {
          bufferMapping = {
            propName: prop.name,
            type: "ArrayBuffer*",
            len: 4,
          };
          totalLength += 4;
        } else {
          let x = this.createBufferMap(prop.type.classType.prototype);
          bufferMapping = {
            propName: prop.name,
            type: x.bufmap,
            len: x.length,
            classType: prop.type.classType,
          };
          totalLength += x.length;
        }
      }

      // array
      if (prop.type.kind == 25) {
        console.log();
        bufferMapping = {
          propName: prop.name,
          // type: prop.ty "array*",
          type: ReflectionKind[prop.type.type.kind] + "[]*",
          len: 4, // pointer size
        };
        totalLength += 4;
      }

      if (prop.type.kind == 6) {
        bufferMapping = {
          propName: prop.name,
          type: "number",
          len: 4,
        };
        totalLength += 4;
      }

      if (prop.type.kind == 7) {
        bufferMapping = {
          propName: prop.name,
          type: "boolean",
          len: 1,
        };
        totalLength += 1;
      }

      if (prop.type.kind == 5) {
        bufferMapping = {
          propName: prop.name,
          type: "string*",
          len: 4,
        };
        totalLength += 4;
      }

      // derive from value
      if (bufferMapping == null) {
        let val = (value as any)[prop.name];
        const valType = val.constructor.name;

        if (valType === "Float32Array") {
          bufferMapping = {
            propName: prop.name,
            type: "Float32Array*",
            len: 4,
          };
          totalLength += 4;
        }
      }

      bufferMap.push(bufferMapping);
    });

    return {
      bufmap: bufferMap,
      length: totalLength,
    };
  }

  deserialize<T extends Component>(
    componentType: ClassConstructor<T>,
    buffer: ArrayBufferLike,
  ): T {
    const mapping = this.bufferMaps.get(componentType);
    if (!mapping) throw new Error("No buffer map for component type");

    const component = new (componentType as any)() as T;
    const dataView = new DataView(buffer);
    let offset = 0;

    mapping.bufmap.forEach((bufMapEntry: any) => {
      console.log(bufMapEntry);
      if (typeof bufMapEntry.type == "string") {
        if (bufMapEntry.type === "number") {
          (component as any)[bufMapEntry.propName] = dataView.getFloat32(
            offset,
            true,
          );

          offset += 4;
        } else if (bufMapEntry.type === "boolean") {
          (component as any)[bufMapEntry.propName] =
            dataView.getUint8(offset) === 1;
          offset += 1;
        } else if (bufMapEntry.type === "string*") {
          const pointerId = dataView.getUint32(offset);
          (component as any)[bufMapEntry.propName] =
            PointerManager.instance.getStringFromPointer(pointerId);
          offset += 4;
        } else if ((bufMapEntry.type as string).endsWith("[]*")) {
          const pointerId = dataView.getUint32(offset);
          console.log(pointerId);
          (component as any)[bufMapEntry.propName] =
            PointerManager.instance.getArrayFromPointer(
              pointerId,
              (bufMapEntry.type as string).split("[]*")[0],
            );
          offset += 4;
        } else if (bufMapEntry.type === "ArrayBuffer*") {
          const pointerId = dataView.getUint32(offset);
          (component as any)[bufMapEntry.propName] =
            PointerManager.instance.getBuffer(pointerId);
          offset += 4;
        }
      } else {
        // nested object
        const nestedBuffer = buffer.slice(offset, offset + bufMapEntry.len);
        const vals = this.deserializeNestedObject(
          bufMapEntry.type,
          nestedBuffer,
        );
        const classInstance = new bufMapEntry.classType();
        Object.assign(classInstance, vals);
        (component as any)[bufMapEntry.propName] = classInstance;
        console.log(bufMapEntry);
        offset += bufMapEntry.len;
      }
    });

    return component;
  }

  deserializeNestedObject(
    type: any,
    nestedBuffer: ArrayBuffer | SharedArrayBuffer,
  ): any {
    const obj: any = {};
    const dataView = new DataView(nestedBuffer);
    let offset = 0;

    type.forEach((bufMapEntry: any) => {
      console.log(bufMapEntry);
      if (bufMapEntry.type === "number") {
        obj[bufMapEntry.propName] = dataView.getFloat32(offset, true);
        offset += 4;
      } else if (bufMapEntry.type === "boolean") {
        obj[bufMapEntry.propName] = dataView.getUint8(offset) === 1;
        offset += 1;
      } else if (bufMapEntry.type === "string*") {
        const pointerId = dataView.getUint32(offset);
        obj[bufMapEntry.propName] =
          PointerManager.instance.getStringFromPointer(pointerId);
        offset += 4;
      } else if ((bufMapEntry.type as string).endsWith("[]*")) {
        const pointerId = dataView.getUint32(offset);
        obj[bufMapEntry.propName] = PointerManager.instance.getArrayFromPointer(
          pointerId,
          (bufMapEntry.type as string).split("[]*")[0],
        );
        offset += 4;
      } else {
        // nested object
        const nestedBufferSlice = nestedBuffer.slice(
          offset,
          offset + bufMapEntry.len,
        );

        const vals = this.deserializeNestedObject(
          bufMapEntry.classType,
          nestedBufferSlice,
        );

        console.log(vals);

        const classInstance = new bufMapEntry.classType();
        Object.assign(classInstance, vals);

        obj[bufMapEntry.propName] = classInstance;

        offset += bufMapEntry.len;
      }
    });

    return obj;
  }
}

class TypeSerializer<T> {
  serialize(value: T): ArrayBufferLike {
    throw new Error("Method not implemented.");
  }
}

class StringSerializer extends TypeSerializer<string> {
  serialize(value: string): ArrayBufferLike {
    const encoder = new TextEncoder();
    return encoder.encode(value).buffer;
  }
}

class NumberSerializer extends TypeSerializer<number> {
  serialize(value: number): ArrayBufferLike {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, value, true);
    return buffer;
  }
}

class BooleanSerializer extends TypeSerializer<boolean> {
  serialize(value: boolean): ArrayBufferLike {
    const buffer = new ArrayBuffer(1);
    new DataView(buffer).setUint8(0, value ? 1 : 0);
    return buffer;
  }
}

class ObjectSerializer extends TypeSerializer<object> {
  typeSerializers: Map<string, TypeSerializer<any>> = new Map();

  constructor() {
    super();

    this.typeSerializers.set("string", new StringSerializer());
    this.typeSerializers.set("number", new NumberSerializer());
    this.typeSerializers.set("boolean", new BooleanSerializer());
    this.typeSerializers.set("object", this);
  }

  // serialize(value: object): ArrayBufferLike {
  //   const properties = Object.getOwnPropertyDescriptors(value);
  //   console.log(properties);
  //   const serializedSize = 0;

  //   for (const [key, descriptor] of Object.entries(properties)) {
  //     const value = descriptor.value;
  //     const type = typeof value;

  //     console.log(key, value);

  //     const serializer = this.typeSerializers.get(type);
  //     serializer.serialize(value);
  //   }
  // }
}
