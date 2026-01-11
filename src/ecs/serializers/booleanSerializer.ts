import { Serializable } from "../component-gen";
import { ComponentBufferViews } from "../ecs";

export class BooleanSerializer extends Serializable<boolean, Uint8Array> {
  deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): boolean {
    return views.Uint8View[offset] == 1 ? true : false;
  }

  serializeTo(
    v: boolean,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void {
    buffer.Uint8View.set([v == true ? 1 : 0], offset);
  }
}
