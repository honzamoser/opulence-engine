import CameraComponent from "H:/Project/engine/opulence-engine/src/ecs/components/camera.component.ts";
import MaterialComponent from "H:/Project/engine/opulence-engine/src/ecs/components/material.component.ts";
import MeshComponent from "H:/Project/engine/opulence-engine/src/ecs/components/mesh.component.ts";
import RigidbodyComponent from "H:/Project/engine/opulence-engine/src/ecs/components/rigidbody.component.ts";
import TransformComponent from "H:/Project/engine/opulence-engine/src/ecs/components/transform.component.ts";

import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { hot, constructor, cold } from "../component-gen";
// GENERATED AT 2026-01-16T08:36:52.798Z
// AUTO-GENERATED - DO NOT EDIT

export interface MemoryViews {
    f32: Float32Array;
    u32: Uint32Array;
    i32: Int32Array;
    u8: Uint8Array;
}

export class CameraComponentAccessor {
    public index: number = 5;
    public static readonly stride: number = NaN;
    public static readonly parent:typeof  CameraComponent = CameraComponent
    
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

    get fov() {
        return this.f32[(this.index * NaN + 0) / 4];
    }
    
    set fov(v: number) {
        this.f32[(this.index * NaN + 0) / 4] = v;
    }

    get near() {
        return this.f32[(this.index * NaN + NaN) / 4];
    }
    
    set near(v: number) {
        this.f32[(this.index * NaN + NaN) / 4] = v;
    }

    get far() {
        return this.f32[(this.index * NaN + NaN) / 4];
    }
    
    set far(v: number) {
        this.f32[(this.index * NaN + NaN) / 4] = v;
    }

    getProjectionMatrix(out: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
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

    setProjectionMatrix(v: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
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

export class MaterialComponentAccessor {
    public index: number = 6;
    public static readonly stride: number = NaN;
    public static readonly parent:typeof  MaterialComponent = MaterialComponent
    
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

    get materialId() {
        return this.i32[(this.index * NaN + 0) / 4];
    }
    
    set materialId(v: number) {
        this.i32[(this.index * NaN + 0) / 4] = v;
    }
}

export class MeshComponentAccessor {
    public index: number = 7;
    public static readonly stride: number = NaN;
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

    get meshId() {
        return this.i32[(this.index * NaN + 0) / 4];
    }
    
    set meshId(v: number) {
        this.i32[(this.index * NaN + 0) / 4] = v;
    }

    get rendererdInstasnceId() {
        return this.i32[(this.index * NaN + NaN) / 4];
    }
    
    set rendererdInstasnceId(v: number) {
        this.i32[(this.index * NaN + NaN) / 4] = v;
    }

    getBoundingBoxMin(out: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setBoundingBoxMin(v: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }

    getBoundingBoxMax(out: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setBoundingBoxMax(v: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }
}

export class RigidbodyComponentAccessor {
    public index: number = 8;
    public static readonly stride: number = NaN;
    public static readonly parent:typeof  RigidbodyComponent = RigidbodyComponent
    
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

    get mass() {
        return this.f32[(this.index * NaN + 0) / 4];
    }
    
    set mass(v: number) {
        this.f32[(this.index * NaN + 0) / 4] = v;
    }

    getVelocity(out: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        out[0] = this.f32[base + 0];
        out[1] = this.f32[base + 1];
        out[2] = this.f32[base + 2];
    }

    setVelocity(v: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        this.f32[base + 0] = v[0];
        this.f32[base + 1] = v[1];
        this.f32[base + 2] = v[2];
    }

    getVertices(out: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        const ptr = this.i32[base]; // pointer address
        const ptr_len = this.i32[base + 1]; // pointer length in bytes
        
        for (let i = 0; i < ptr_len; i++) {
            out[i] = this.f32[ptr / 4 + i];
        }
    }

    setVertices(v: Float32Array | number[]): void {
        const base = (this.index * NaN + NaN) / 4;
        const ptr = this.i32[base];
        const ptr_len = this.i32[base + 1];

        if(v.byteLength > ptr_len) {
            throw new Error("Pointer overflow: trying to write more data than allocated.");
        }

        for (let i = 0; i < v.length; i++) {
            this.f32[ptr / 4 + i] = v[i];
        }
    }
}

export class TransformComponentAccessor {
    public index: number = 9;
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

export const generatedComponents = [CameraComponentAccessor, MaterialComponentAccessor, MeshComponentAccessor, RigidbodyComponentAccessor, TransformComponentAccessor];

export const components = [{
    name: "CameraComponent",
    path: "/src/ecs/components/camera.component.ts",
    id: 0,
    stride: 76,
    cls: CameraComponent,
    fields: [{
        name: "fov",
        count: 1,
        offset: 0,
        pointer: false,
        type: "float32",
        defaultValue: Math.PI / 2,
    }, {
        name: "near",
        count: 1,
        offset: 4,
        pointer: false,
        type: "float32",
        defaultValue: 0.1,
    }, {
        name: "far",
        count: 1,
        offset: 8,
        pointer: false,
        type: "float32",
        defaultValue: 1000,
    }, {
        name: "projectionMatrix",
        count: 16,
        offset: 12,
        pointer: false,
        type: "float32Array",
        defaultValue: mat4.create(),
    }]},{
    name: "MaterialComponent",
    path: "/src/ecs/components/material.component.ts",
    id: 1,
    stride: 4,
    cls: MaterialComponent,
    fields: [{
        name: "materialId",
        count: 1,
        offset: 0,
        pointer: false,
        type: "int32",
        
    }]},{
    name: "MeshComponent",
    path: "/src/ecs/components/mesh.component.ts",
    id: 2,
    stride: 32,
    cls: MeshComponent,
    fields: [{
        name: "meshId",
        count: 1,
        offset: 0,
        pointer: false,
        type: "int32",
        
    }, {
        name: "rendererdInstasnceId",
        count: 1,
        offset: 4,
        pointer: false,
        type: "int32",
        
    }, {
        name: "boundingBoxMin",
        count: 3,
        offset: 8,
        pointer: false,
        type: "float32Array",
        defaultValue: vec3.create(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ),
    }, {
        name: "boundingBoxMax",
        count: 3,
        offset: 20,
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
    id: 3,
    stride: 24,
    cls: RigidbodyComponent,
    fields: [{
        name: "mass",
        count: 1,
        offset: 0,
        pointer: false,
        type: "float32",
        defaultValue: 1,
    }, {
        name: "velocity",
        count: 3,
        offset: 4,
        pointer: false,
        type: "float32Array",
        defaultValue: vec3.zero(),
    }, {
        name: "vertices",
        count: 2,
        offset: 16,
        pointer: true,
        type: "float32Array",
        
    }]},{
    name: "TransformComponent",
    path: "/src/ecs/components/transform.component.ts",
    id: 4,
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