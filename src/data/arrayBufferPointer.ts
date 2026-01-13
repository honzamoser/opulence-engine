export class PointerManager {
  getBuffer(pointerId: number): any {
    return this.buffers[pointerId];
  }
  getSafePointerId(): number {
    return Math.floor(Math.random() * 1000000);
  }

  getArrayFromPointer(pointerId: number, arrayType: string): any {
    const buffer = this.buffers[pointerId];
    console.log(buffer, pointerId);
    if (arrayType == "number") {
      const typedArray = new Float32Array(buffer);
      return Array.from(typedArray);
    }
    if (arrayType == "string") {
      const typedArray = new Uint32Array(buffer);
      const result: string[] = [];
      for (let i = 0; i < typedArray.length; i++) {
        const stringPointerId = typedArray[i];
        const str = this.getStringFromPointer(stringPointerId);
        result.push(str);
      }
      return result;
    }
    return null;
  }
  getStringFromPointer(pointerId: number): string {
    const buffer = this.buffers[pointerId];
    const decoder = new TextDecoder();
    const uint8Array = new Uint8Array(buffer);
    return decoder.decode(uint8Array);
  }
  createArrayPointerTo(propValue: any[], arrayType: string) {
    console.log(this);

    const pointer = this.getSafePointerId();
    console.error(pointer);
    let buffer: ArrayBuffer;

    if (arrayType == "number") {
      console.log("PV", propValue);
      const typedArray = new Float32Array(propValue.length);
      const dataView = new DataView(typedArray.buffer);

      propValue.forEach((num, index) => {
        dataView.setFloat32(index * 4, num, true);
      });

      console.log(typedArray.buffer);

      buffer = typedArray.buffer;
    }

    if ((arrayType = "string")) {
      const typedArray = new Uint32Array(propValue.length);
      let offset = 0;
      for (let string of propValue) {
        let p = this.createStringPointerTo(string);
        typedArray[offset] = p.pointerId;
        offset++;
      }
    }

    this.buffers[pointer] = buffer as ArrayBuffer;
    console.error(this.buffers[pointer] == buffer);
    return new Pointer(pointer, this, 25);
  }

  static instance: PointerManager;
  buffers: ArrayBuffer[] = [];

  createPointerTo(buffer: ArrayBuffer) {
    const pointer = this.buffers.length;
    console.error(pointer);

    this.buffers.push(buffer);
    return new Pointer(pointer, this, 20);
  }

  createStringPointerTo(string: string) {
    const pointer = this.buffers.length;
    console.error(pointer);

    const encoder = new TextEncoder();
    const buffer = encoder.encode(string).buffer;
    this.buffers.push(buffer as ArrayBuffer);
    return new Pointer(pointer, this, 5);
  }

  constructor() {
    if (!PointerManager.instance) {
      PointerManager.instance = this;
    }
    return PointerManager.instance;
  }
}

export class Pointer {
  pointerId: number;
  pointerType: number;
  pointerManagerRef: PointerManager;

  constructor(
    pointerId: number,
    pointerManagerRef: PointerManager,
    type: number,
  ) {
    this.pointerId = pointerId;
    this.pointerManagerRef = pointerManagerRef;
    this.pointerType = type;

    console.log("Created pointer with ID ", pointerId);
  }

  getBuffer(): ArrayBuffer {
    return this.pointerManagerRef.buffers[this.pointerId];
  }
}
