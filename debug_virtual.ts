import MeshComponent from "D:/projects/opulence/opulence-engine/src/ecs/components/mesh.component.ts";
import TransformComponent from "D:/projects/opulence/opulence-engine/src/ecs/components/transform.component.ts";

import { mat4 } from "wgpu-matrix";
import { Mat4 } from "wgpu-matrix";
import { vec3 } from "wgpu-matrix";
import { Vec3 } from "wgpu-matrix";
import { Component } from "D:\projects\opulence\opulence-engine\src\ecs\component";
import { hot } from "D:\projects\opulence\opulence-engine\src\ecs\component-gen";
import { constructor } from "D:\projects\opulence\opulence-engine\src\ecs\component-gen";
import { cold } from "D:\projects\opulence\opulence-engine\src\ecs\component-gen";
import { PointerTo } from "D:\projects\opulence\opulence-engine\component_parsers";
// GENERATED AT 2026-01-21T09:35:23.811Z
// AUTO-GENERATED - DO NOT EDIT

export interface MemoryViews {
    f32: Float32Array;
    u32: Uint32Array;
    i32: Int32Array;
    u8: Uint8Array;
}

export class MeshComponentAccessor {
    public index: number = 2;
    public static readonly stride: number = 12;
    public static readonly parent:typeof  MeshComponent = MeshComponent
    
    private f32: Float32Array;
    private i32: Int32Array;
    private u8: Uint8Array;

    private cf32: Float32Array;
    private ci32: Int32Array;
    private cu8: Uint8Array;

    constructor(views: MemoryViews, coldViews: MemoryViews) {
        this.f32 = views.f32;
        this.i32 = views.i32;
        this.u8 = views.u8;

        this.cf32 = coldViews.f32;
        this.ci32 = coldViews.i32;
        this.cu8 = coldViews.u8;
    }

    to(index: number) {
        this.index = index;
        return this;
    }

    getBoundingBoxMax(out: Float32Array | number[]): void {
        const base = (this.index * 12 + 0) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setBoundingBoxMax(v: Float32Array | number[]): void {
        const base = (this.index * 12 + 0) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }
}

export class TransformComponentAccessor {
    public index: number = 3;
    public static readonly stride: number = 100;
    public static readonly parent:typeof  TransformComponent = TransformComponent
    
    private f32: Float32Array;
    private i32: Int32Array;
    private u8: Uint8Array;

    private cf32: Float32Array;
    private ci32: Int32Array;
    private cu8: Uint8Array;

    constructor(views: MemoryViews, coldViews: MemoryViews) {
        this.f32 = views.f32;
        this.i32 = views.i32;
        this.u8 = views.u8;

        this.cf32 = coldViews.f32;
        this.ci32 = coldViews.i32;
        this.cu8 = coldViews.u8;
    }

    to(index: number) {
        this.index = index;
        return this;
    }

    getPosition(out: Float32Array | number[]): void {
        const base = (this.index * 100 + 0) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setPosition(v: Float32Array | number[]): void {
        const base = (this.index * 100 + 0) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }

    getRotation(out: Float32Array | number[]): void {
        const base = (this.index * 100 + 12) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setRotation(v: Float32Array | number[]): void {
        const base = (this.index * 100 + 12) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }

    getScale(out: Float32Array | number[]): void {
        const base = (this.index * 100 + 24) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setScale(v: Float32Array | number[]): void {
        const base = (this.index * 100 + 24) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }

    getMatrix(out: Float32Array | number[]): void {
        const base = (this.index * 100 + 36) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
        out[3] = this.f32[base + 3];
        out[4] = this.f32[base + 4];
        out[5] = this.f32[base + 5];
        out[6] = this.f32[base + 6];
        out[7] = this.f32[base + 7];
        out[8] = this.f32[base + 8];
        out[9] = this.f32[base + 9];
        out[10] = this.f32[base + 10];
        out[11] = this.f32[base + 11];
        out[12] = this.f32[base + 12];
        out[13] = this.f32[base + 13];
        out[14] = this.f32[base + 14];
        out[15] = this.f32[base + 15];
    }

    setMatrix(v: Float32Array | number[]): void {
        const base = (this.index * 100 + 36) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
        this.f32[base + 3] = v[3];
        this.f32[base + 4] = v[4];
        this.f32[base + 5] = v[5];
        this.f32[base + 6] = v[6];
        this.f32[base + 7] = v[7];
        this.f32[base + 8] = v[8];
        this.f32[base + 9] = v[9];
        this.f32[base + 10] = v[10];
        this.f32[base + 11] = v[11];
        this.f32[base + 12] = v[12];
        this.f32[base + 13] = v[13];
        this.f32[base + 14] = v[14];
        this.f32[base + 15] = v[15];
    }
}

export const generatedComponents = [MeshComponentAccessor, TransformComponentAccessor];

type PointerType<T> = number;
export const components = [{
    name: "CameraComponent",
    path: "/src/ecs/components/camera.component.ts",
    id: 0,
    stride: 0,
    cls: CameraComponent,
    fields: []},{
    name: "MeshComponent",
    path: "/src/ecs/components/mesh.component.ts",
    id: 1,
    stride: 12,
    cls: MeshComponent,
    fields: [{
        name: "boundingBoxMax",
        count: 3,
        offset: 0,
        pointer: false,
        type: "float32Array",
        defaultValue: vec3.create(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ),
    }]},{
    name: "RigidbodyComponent",
    path: "/src/ecs/components/rigidbody.component.ts",
    id: 2,
    stride: 0,
    cls: RigidbodyComponent,
    fields: []},{
    name: "TransformComponent",
    path: "/src/ecs/components/transform.component.ts",
    id: 3,
    stride: 100,
    cls: TransformComponent,
    fields: [{
        name: "position",
        count: 3,
        offset: 0,
        pointer: false,
        type: "float32Array",
        
    }, {
        name: "rotation",
        count: 3,
        offset: 12,
        pointer: false,
        type: "float32Array",
        defaultValue: vec3.create(0, 0, 0),
    }, {
        name: "scale",
        count: 3,
        offset: 24,
        pointer: false,
        type: "float32Array",
        defaultValue: vec3.create(1, 1, 1),
    }, {
        name: "matrix",
        count: 16,
        offset: 36,
        pointer: false,
        type: "float32Array",
        defaultValue: mat4.identity(),
    }]}]
 export type CameraComponentConstructionFootprint = {
}

 export type MeshComponentConstructionFootprint = {
  boundingBoxMax: Float32Array;
}

 export type RigidbodyComponentConstructionFootprint = {
}

 export type TransformComponentConstructionFootprint = {
  position: Float32Array;
  rotation: Float32Array;
  scale: Float32Array;
  matrix: Float32Array;
}
