import { Serializable } from "../component-gen";
import { ComponentBufferViews } from "../ecs";

export default class StringSerializer extends Serializable<string, Uint8Array> {
  serialize(v: string): Uint8Array | Float32Array | Int32Array | ArrayBuffer {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(v);

    return encoded;
  }

  deserialize(
    views: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): string {
    const slice = views.Uint8View.slice(offset, offset + byteLength);
    const decoder = new TextDecoder();
    return decoder.decode(slice);
  }

  serializeTo(
    v: string,
    buffer: ComponentBufferViews,
    offset: number,
    byteLength: number,
  ): void {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(v);

    if (encoded.byteLength <= byteLength) {
      buffer.Uint8View.set(encoded, offset);
    }
  }
}
