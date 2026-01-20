
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { hot } from "../component-gen";


    type PropertyType = "u8" | "i16" | "u16" | "i32" | "u32" | "f32" | "char" | "Vec2" | "Vec3" | "Mat3" | "Mat4"
    | "u8[]" | "i16[]" | "u16[]" | "i32[]" | "u32[]" | "f32[]" | "char[]" | "&u8[]" | "&i16[]" | "&u16[]" | "&i32[]" | "&u32[]" | "&f32[]" | "&char[]";

type PropertyDefinition = {
    name: string | null,
    type: PropertyType,
    jsType: string,
    byteLength: number,

    arrayLength?: number,
    pointer?: boolean,
    length?: number,
    offset: number | null,
    default?: string
}


type PointerTo<T> = {
    ptr: number | undefined,
    ptr_len: number
}

type ComponentDescription = {
    name: string,
    stride: number,
    importStatement: string,
    properties: PropertyDefinition[],
}



type CameraComponentSignature = {
    fov: number;
    near: number;
    far: number;
    projectionMatrix: Mat4;
    _componentId: number;}

export class CameraComponent {
    static STRIDE: number = 84;
    static IDENTIFIER: number = 1;
    static DESCRIPTION: ComponentDescription = {"name":"CameraComponent","stride":84,"importStatement":"import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { hot } from \"../component-gen\";","properties":[{"name":"fov","type":"f32","byteLength":4,"offset":4,"jsType":"number","default":"Math.PI / 2"},{"name":"near","type":"f32","byteLength":4,"offset":8,"jsType":"number","default":"0.1"},{"name":"far","type":"f32","byteLength":4,"offset":12,"jsType":"number","default":"1000"},{"name":"projectionMatrix","type":"f32[]","byteLength":64,"length":16,"offset":16,"jsType":"Mat4","default":"mat4.create()"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: number[] = [];
    static NEXT: number = 0;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: {vf32: Float32Array,vi32: Int32Array,vu8: Uint8Array}) {
		CameraComponent.vf32 = v.vf32
		CameraComponent.vi32 = v.vi32
		CameraComponent.vu8 = v.vu8


        CameraComponent.IS_INITIALIZED = true;
    }
    static new(v: Partial<CameraComponentSignature>) {
        const memId = CameraComponent.SET.length;
        CameraComponent.SET[memId] = memId;

        const constructionData: CameraComponentSignature = {
            fov: v.fov ? v.fov : Math.PI / 2,
near: v.near ? v.near : 0.1,
far: v.far ? v.far : 1000,
projectionMatrix: v.projectionMatrix ? v.projectionMatrix : mat4.create(),
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = CameraComponent.MEM_CURSOR * 84;
    CameraComponent.vi32[base / 4] = memId;
    CameraComponent.MEM_CURSOR += 1;
    CameraComponent.vf32[base / 4 + 1 + 0] = constructionData.fov;
CameraComponent.vf32[base / 4 + 2 + 0] = constructionData.near;
CameraComponent.vf32[base / 4 + 3 + 0] = constructionData.far;
CameraComponent.vf32.set(constructionData.projectionMatrix, base / 4 + 4);

    
    }
        
    static delete() {
       if (CameraComponent.CURSOR < CameraComponent.SET.length) {
        CameraComponent.SET[CameraComponent.SET.length - 1] = CameraComponent.SET[CameraComponent.CURSOR]; 
        CameraComponent.SET[CameraComponent.CURSOR] = undefined;
        CameraComponent.MEM_CURSOR = CameraComponent.SET[CameraComponent.CURSOR];
       } 

        // move data from last component in dense array to the deleted component's position
        if (CameraComponent.SET.length > CameraComponent.MEM_CURSOR) {
            const baseSrc = CameraComponent.NEXT * 84;
            const baseDst = CameraComponent.MEM_CURSOR * 84;

            // Copy data in vf32
            for (let i = 0; i < 120 / 4; i++) {
                CameraComponent.vf32[baseDst / 4 + i] = CameraComponent.vf32[baseSrc / 4 + i];
            }
        }
    }
    

    static to(cId: number) {

        if (CameraComponent.SET[cId] == undefined) {
            throw new Error("Entity does not have this component");
        }

        CameraComponent.MEM_CURSOR = CameraComponent.SET[cId]
        CameraComponent.CURSOR = cId;
        return CameraComponent;
    }

   static get fov() {
        return CameraComponent.vf32[1 + CameraComponent.MEM_CURSOR * 21];
    } 
    
    static set fov(v: number) {
        CameraComponent.vf32[1 + CameraComponent.MEM_CURSOR * 21] = v;
    }   static get near() {
        return CameraComponent.vf32[2 + CameraComponent.MEM_CURSOR * 21];
    } 
    
    static set near(v: number) {
        CameraComponent.vf32[2 + CameraComponent.MEM_CURSOR * 21] = v;
    }   static get far() {
        return CameraComponent.vf32[3 + CameraComponent.MEM_CURSOR * 21];
    } 
    
    static set far(v: number) {
        CameraComponent.vf32[3 + CameraComponent.MEM_CURSOR * 21] = v;
    }   static get projectionMatrix() {
        return CameraComponent.vf32.subarray(4 + CameraComponent.MEM_CURSOR * 21, 20 + CameraComponent.MEM_CURSOR * 21)
    } 

    static set projectionMatrix(v: Mat4) {
            CameraComponent.vf32.set(v, 4 + CameraComponent.MEM_CURSOR * 21)

        }

    static cpy_projectionMatrix(out: Mat4) {
         out.set(CameraComponent.vf32.subarray(4 + CameraComponent.MEM_CURSOR * 21, 20 + CameraComponent.MEM_CURSOR * 21))

    }
    

   static get _componentId() {
        return CameraComponent.vi32[0 + CameraComponent.MEM_CURSOR * 21];
    } 
    
    static set _componentId(v: number) {
        CameraComponent.vi32[0 + CameraComponent.MEM_CURSOR * 21] = v;
    }}
