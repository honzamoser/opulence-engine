import { Serializable } from "../component-gen";
import { ComponentBufferViews } from "../ecs";

export class Float32ArraySerializer extends Serializable<
  Float32Array,
  Float32Array
> {
  serialize(
    v: Float32Array,
  ): Uint8Array | Float32Array | Int32Array | ArrayBuffer {
    return v;
  }
  deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): Float32Array<ArrayBufferLike> {
    return views.Float32View.subarray(offset / 4, offset / 4 + byteLength / 4);
  }

  serializeTo(
    v: Float32Array<ArrayBufferLike>,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void {
    if (v.byteLength <= byteLength) {
      buffer.Float32View.set(v, offset / 4);
    } else {
      console.warn(
        `Attempted to write array of length ${v.byteLength} to a field of capacity ${byteLength}`,
      );
    }
  }

  byteLength(value: Float32Array | null): number {
    return value ? value.byteLength : 0;
  }
}
