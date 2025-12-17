import { serializable, Serializable } from "../component-gen";
import { ComponentBufferViews } from "../ecs";

@serializable
export class Int32Serializer extends Serializable<number, Int32Array> {
  serialize(v: number): Uint8Array | Float32Array | Int32Array | ArrayBuffer {
    return new Int32Array([v]);
  }

  deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): number {
    return views.Int32View[offset / 4];
  }

  serializeTo(
    v: number,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void {
    buffer.Int32View.set([v], offset / 4);
  }
}
