import { Serializable } from "../component-gen";
export class Int32Serializer extends Serializable {
    serialize(v) {
        return new Int32Array([v]);
    }
    deserialize(views, offset, byteLength) {
        return views.Int32View[offset / 4];
    }
    serializeTo(v, buffer, offset, byteLength) {
        buffer.Int32View.set([v], offset / 4);
    }
}
