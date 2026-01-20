type MeshComponent = import("/workspaces/legends-of-league/src/ecs/components/mesh.component.ts").default;
type TransformComponent = import("/workspaces/legends-of-league/src/ecs/components/transform.component.ts").default;

declare module "virtual:ecs" {
    
export interface MemoryViews {
    f32: Float32Array;
    u32: Uint32Array;
    i32: Int32Array;
    u8: Uint8Array;
}
export class MeshComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: MeshComponent;
    private f32;
    private i32;
    private u8;
    private cf32;
    private ci32;
    private cu8;
    constructor(views: MemoryViews, coldViews: MemoryViews);
    to(index: number): this;
    getBoundingBoxMax(out: Float32Array | number[]): void;
    setBoundingBoxMax(v: Float32Array | number[]): void;
}
export class TransformComponentAccessor {
    index: number;
    static readonly stride: number;
    static readonly parent: TransformComponent;
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
export const generatedComponents: (MeshComponentAccessor | TransformComponentAccessor)[];
export const components: ({
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: any;
    fields: any[];
} | {
    name: string;
    path: string;
    id: number;
    stride: number;
    cls: MeshComponent;
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
    cls: TransformComponent;
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
export type CameraComponentConstructionFootprint = {};
export type MeshComponentConstructionFootprint = {
    boundingBoxMax: Float32Array;
};
export type RigidbodyComponentConstructionFootprint = {};
export type TransformComponentConstructionFootprint = {
    position: Float32Array;
    rotation: Float32Array;
    scale: Float32Array;
    matrix: Float32Array;
};

}
