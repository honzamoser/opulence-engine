type CameraComponent = import("H:/Project/engine/opulence-engine/src/ecs/components/camera.component.ts").default;
type MaterialComponent = import("H:/Project/engine/opulence-engine/src/ecs/components/material.component.ts").default;
type MeshComponent = import("H:/Project/engine/opulence-engine/src/ecs/components/mesh.component.ts").default;
type RigidbodyComponent = import("H:/Project/engine/opulence-engine/src/ecs/components/rigidbody.component.ts").default;
type TransformComponent = import("H:/Project/engine/opulence-engine/src/ecs/components/transform.component.ts").default;

declare module "virtual:ecs" {
    
export interface MemoryViews {
    f32: Float32Array;
    u32: Uint32Array;
    i32: Int32Array;
    u8: Uint8Array;
}
export class CameraComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: typeof CameraComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    get fov(): number;
    set fov(v: number);
    get near(): number;
    set near(v: number);
    get far(): number;
    set far(v: number);
    getProjectionMatrix(out: Float32Array | number[]): void;
    setProjectionMatrix(v: Float32Array | number[]): void;
}
export class MaterialComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: typeof MaterialComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    get materialId(): number;
    set materialId(v: number);
}
export class MeshComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: typeof MeshComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    get meshId(): number;
    set meshId(v: number);
    get rendererdInstasnceId(): number;
    set rendererdInstasnceId(v: number);
    getBoundingBoxMin(out: Float32Array | number[]): void;
    setBoundingBoxMin(v: Float32Array | number[]): void;
    getBoundingBoxMax(out: Float32Array | number[]): void;
    setBoundingBoxMax(v: Float32Array | number[]): void;
}
export class RigidbodyComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: typeof RigidbodyComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    get mass(): number;
    set mass(v: number);
    getVelocity(out: Float32Array | number[]): void;
    setVelocity(v: Float32Array | number[]): void;
    getVertices(out: Float32Array | number[]): void;
    setVertices(v: Float32Array | number[]): void;
}
export class TransformComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: typeof TransformComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    getPosition(out: Float32Array | number[]): void;
    setPosition(v: Float32Array | number[]): void;
    getRotation(out: Float32Array | number[]): void;
    setRotation(v: Float32Array | number[]): void;
    getScale(out: Float32Array | number[]): void;
    setScale(v: Float32Array | number[]): void;
    getMatrix(out: Float32Array | number[]): void;
    setMatrix(v: Float32Array | number[]): void;
}
export const generatedComponents: (typeof CameraComponentAccessor | typeof MaterialComponentAccessor | typeof MeshComponentAccessor | typeof RigidbodyComponentAccessor | typeof TransformComponentAccessor)[];
export const components: ({
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: typeof CameraComponent;
    fields: {
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue: any;
    }[];
} | {
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: typeof MaterialComponent;
    fields: {
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
    }[];
} | {
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: typeof MeshComponent;
    fields: ({
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue?: undefined;
    } | {
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue: any;
    })[];
} | {
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: typeof RigidbodyComponent;
    fields: ({
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue: any;
    } | {
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue?: undefined;
    })[];
} | {
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: typeof TransformComponent;
    fields: ({
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue?: undefined;
    } | {
        name: string;
        count: number;
        offset: number;
        pointer: boolean;
        type: string;
        defaultValue: any;
    })[];
})[];

}
