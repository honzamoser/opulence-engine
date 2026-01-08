import { Serializable } from "../component-gen";
export class Float32ArraySerializer extends Serializable {
    serialize(v) {
        return v;
    }
    deserialize(views, offset, byteLength) {
        console.log("Returning subarray of ", offset, byteLength);
        return views.Float32View.subarray(offset / 4, offset / 4 + byteLength / 4);
    }
    serializeTo(v, buffer, offset, byteLength) {
        if (v.byteLength <= byteLength) {
            buffer.Float32View.set(v, offset / 4);
        }
        else {
            console.warn(`Attempted to write array of length ${v.byteLength} to a field of capacity ${byteLength}`);
        }
    }
}
