import { Serializable } from "../component-gen";
export class BooleanSerializer extends Serializable {
    deserialize(views, offset, byteLength) {
        return views.Uint8View[offset] == 1 ? true : false;
    }
    serializeTo(v, buffer, offset, byteLength) {
        buffer.Uint8View.set([v == true ? 1 : 0], offset);
    }
}
