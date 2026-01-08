import { Serializable } from "../component-gen";
export default class StringSerializer extends Serializable {
    constructor() {
        super(...arguments);
        this.decoder = new TextDecoder();
    }
    serialize(v) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(v);
        return encoded;
    }
    deserialize(views, offset, byteLength) {
        const slice = views.Uint8View.subarray(offset, offset + byteLength);
        const decoded = this.decoder.decode(slice);
        const nullIndex = decoded.indexOf("\0");
        return nullIndex === -1 ? decoded : decoded.substring(0, nullIndex);
    }
    serializeTo(v, buffer, offset, byteLength) {
        const encoder = new TextEncoder();
        const encoded = encoder.encode(v);
        if (encoded.byteLength <= byteLength) {
            buffer.Uint8View.set(encoded, offset);
        }
    }
}
