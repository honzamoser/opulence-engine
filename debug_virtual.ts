import { RigidbodyComponent } from "./component";

const buffer = new ArrayBuffer(2048);
const f32v = new Float32Array(buffer);
const i32v = new Int32Array(buffer);
const u8v = new Uint8Array(buffer);

RigidbodyComponent.initialize({vf32: f32v, vi32: i32v, vu8: u8v});
RigidbodyComponent.new({
    test: 12
})

RigidbodyComponent.new({
    test: 21
})

RigidbodyComponent.new({
    test: 31
})


console.log(RigidbodyComponent.SET, RigidbodyComponent.SET[0])

RigidbodyComponent.to(0).position.set([1, 2, 3]);
console.log("c0 ", RigidbodyComponent.SET, RigidbodyComponent.SET[0])
RigidbodyComponent.to(1).position.set([3, 2, 1]);
console.log("c1 ", RigidbodyComponent.SET, RigidbodyComponent.SET[0])
RigidbodyComponent.to(2).position.set([2, 2, 1]);
console.log("c2 ", RigidbodyComponent.SET, RigidbodyComponent.SET[0])

RigidbodyComponent.to(0);
console.log("c0 ", RigidbodyComponent.position, RigidbodyComponent._componentId)
RigidbodyComponent.to(1);
console.log("c1 ", RigidbodyComponent.position, RigidbodyComponent._componentId)
RigidbodyComponent.to(2);
console.log("c2 ", RigidbodyComponent.position, RigidbodyComponent._componentId)
RigidbodyComponent.to(0).delete();
console.log("c0 ", RigidbodyComponent.SET, RigidbodyComponent.SET[0])

RigidbodyComponent.to(2);
console.log(RigidbodyComponent.CURSOR)
console.log(RigidbodyComponent.position, RigidbodyComponent._componentId)
RigidbodyComponent.to(1);
console.log(RigidbodyComponent.CURSOR)
console.log(RigidbodyComponent.position, RigidbodyComponent._componentId)

console.log(RigidbodyComponent.SET, RigidbodyComponent.SET[0])

