import { Serializable } from "../component-gen";
export class Float32Serializer extends Serializable {
    deserialize(views, offset, byteLength) {
        return views.Float32View[offset / 4];
    }
    serializeTo(v, buffer, offset, byteLength) {
        buffer.Float32View.set([v], offset / 4);
    }
}
