import { Serializable } from "../component-gen";
import { ComponentBufferViews } from "../ecs";

export class Float32Serializer extends Serializable<number, Float32Array> {
  deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): number {
    return views.Float32View[offset / 4];
  }

  serializeTo(
    v: number,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void {
    buffer.Float32View.set([v], offset / 4);
  }
}
