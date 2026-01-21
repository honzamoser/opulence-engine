
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { hot } from "../component-gen";


import {SparseSet } from "./index"

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
    position: Vec3;
    rotation: Vec3;
    projectionMatrix: Mat4;
    _componentId: number;}

export class CameraComponent {
    static STRIDE: number = 108;
    static IDENTIFIER: number = 0;
    static DESCRIPTION: ComponentDescription = {"name":"CameraComponent","stride":108,"importStatement":"import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { hot } from \"../component-gen\";","properties":[{"name":"fov","type":"f32","byteLength":4,"offset":4,"jsType":"number","default":"Math.PI / 2"},{"name":"near","type":"f32","byteLength":4,"offset":8,"jsType":"number","default":"0.1"},{"name":"far","type":"f32","byteLength":4,"offset":12,"jsType":"number","default":"1000"},{"name":"position","type":"f32[]","byteLength":12,"length":3,"offset":16,"jsType":"Vec3","default":"vec3.zero()"},{"name":"rotation","type":"f32[]","byteLength":12,"length":3,"offset":28,"jsType":"Vec3","default":"vec3.zero()"},{"name":"projectionMatrix","type":"f32[]","byteLength":64,"length":16,"offset":40,"jsType":"Mat4","default":"mat4.create()"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;

    declare _constructionFootprint: CameraComponentSignature;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: {vf32: Float32Array,vi32: Int32Array,vu8: Uint8Array}) {
		CameraComponent.vf32 = v.vf32
		CameraComponent.vi32 = v.vi32
		CameraComponent.vu8 = v.vu8


        CameraComponent.IS_INITIALIZED = true;
        CameraComponent.SET = new SparseSet();
    }
    static new(v: Partial<CameraComponentSignature>) {
        const elId = CameraComponent.NEXT;
    CameraComponent.NEXT += 1;
    const memId = CameraComponent.SET.add(elId);

        const constructionData: CameraComponentSignature = {
            fov: v.fov ? v.fov : Math.PI / 2,
near: v.near ? v.near : 0.1,
far: v.far ? v.far : 1000,
position: v.position ? v.position : vec3.zero(),
rotation: v.rotation ? v.rotation : vec3.zero(),
projectionMatrix: v.projectionMatrix ? v.projectionMatrix : mat4.create(),
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = CameraComponent.MEM_CURSOR * 108;
    CameraComponent.vi32[base / 4] = memId;
    CameraComponent.MEM_CURSOR += 1;
    CameraComponent.vf32[base / 4 + 1 + 0] = constructionData.fov;
CameraComponent.vf32[base / 4 + 2 + 0] = constructionData.near;
CameraComponent.vf32[base / 4 + 3 + 0] = constructionData.far;
CameraComponent.vf32[base / 4 + 4 + 0] = constructionData.position[0];CameraComponent.vf32[base / 4 + 4 + 1] = constructionData.position[1];CameraComponent.vf32[base / 4 + 4 + 2] = constructionData.position[2];
CameraComponent.vf32[base / 4 + 7 + 0] = constructionData.rotation[0];CameraComponent.vf32[base / 4 + 7 + 1] = constructionData.rotation[1];CameraComponent.vf32[base / 4 + 7 + 2] = constructionData.rotation[2];
CameraComponent.vf32.set(constructionData.projectionMatrix, base / 4 + 10);

    

    return elId;
    }
        
    static delete() {
    //    if (CameraComponent.CURSOR < CameraComponent.SET.length) {
    //     CameraComponent.SET[CameraComponent.SET.length - 1] = CameraComponent.SET[CameraComponent.CURSOR]; 
    //     CameraComponent.SET[CameraComponent.CURSOR] = undefined;
    //     CameraComponent.MEM_CURSOR = CameraComponent.SET[CameraComponent.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        CameraComponent.SET.remove(CameraComponent.CURSOR);
    }
    

    static to(cId: number) {

        if (!CameraComponent.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        CameraComponent.MEM_CURSOR = CameraComponent.SET.getValue(cId);
        CameraComponent.CURSOR = cId;
        return CameraComponent;
    }

   static get fov() {
        return CameraComponent.vf32[1 + CameraComponent.MEM_CURSOR * 27];
    } 
    
    static set fov(v: number) {
        CameraComponent.vf32[1 + CameraComponent.MEM_CURSOR * 27] = v;
    }   static get near() {
        return CameraComponent.vf32[2 + CameraComponent.MEM_CURSOR * 27];
    } 
    
    static set near(v: number) {
        CameraComponent.vf32[2 + CameraComponent.MEM_CURSOR * 27] = v;
    }   static get far() {
        return CameraComponent.vf32[3 + CameraComponent.MEM_CURSOR * 27];
    } 
    
    static set far(v: number) {
        CameraComponent.vf32[3 + CameraComponent.MEM_CURSOR * 27] = v;
    }   static get position() {
        return CameraComponent.vf32.subarray(4 + CameraComponent.MEM_CURSOR * 27, 7 + CameraComponent.MEM_CURSOR * 27)
    } 

    static set position(v: Vec3) {
            CameraComponent.vf32[4 + CameraComponent.MEM_CURSOR * 27] = v[0]
CameraComponent.vf32[5 + CameraComponent.MEM_CURSOR * 27] = v[1]
CameraComponent.vf32[6 + CameraComponent.MEM_CURSOR * 27] = v[2]

        }

    static cpy_position(out: Vec3) {
          out[0] = CameraComponent.vf32[4 + CameraComponent.MEM_CURSOR * 27]
 out[1] = CameraComponent.vf32[5 + CameraComponent.MEM_CURSOR * 27]
 out[2] = CameraComponent.vf32[6 + CameraComponent.MEM_CURSOR * 27]

    }
    


            static get positionX () {
        return CameraComponent.vf32[4 + CameraComponent.MEM_CURSOR * 27];
            }

            static get positionY () {
        return CameraComponent.vf32[5 + CameraComponent.MEM_CURSOR * 27];
            }

            static get positionZ () {
        return CameraComponent.vf32[6 + CameraComponent.MEM_CURSOR * 27];
            }
        
               static get rotation() {
        return CameraComponent.vf32.subarray(7 + CameraComponent.MEM_CURSOR * 27, 10 + CameraComponent.MEM_CURSOR * 27)
    } 

    static set rotation(v: Vec3) {
            CameraComponent.vf32[7 + CameraComponent.MEM_CURSOR * 27] = v[0]
CameraComponent.vf32[8 + CameraComponent.MEM_CURSOR * 27] = v[1]
CameraComponent.vf32[9 + CameraComponent.MEM_CURSOR * 27] = v[2]

        }

    static cpy_rotation(out: Vec3) {
          out[0] = CameraComponent.vf32[7 + CameraComponent.MEM_CURSOR * 27]
 out[1] = CameraComponent.vf32[8 + CameraComponent.MEM_CURSOR * 27]
 out[2] = CameraComponent.vf32[9 + CameraComponent.MEM_CURSOR * 27]

    }
    


            static get rotationX () {
        return CameraComponent.vf32[7 + CameraComponent.MEM_CURSOR * 27];
            }

            static get rotationY () {
        return CameraComponent.vf32[8 + CameraComponent.MEM_CURSOR * 27];
            }

            static get rotationZ () {
        return CameraComponent.vf32[9 + CameraComponent.MEM_CURSOR * 27];
            }
        
               static get projectionMatrix() {
        return CameraComponent.vf32.subarray(10 + CameraComponent.MEM_CURSOR * 27, 26 + CameraComponent.MEM_CURSOR * 27)
    } 

    static set projectionMatrix(v: Mat4) {
            CameraComponent.vf32.set(v, 10 + CameraComponent.MEM_CURSOR * 27)

        }

    static cpy_projectionMatrix(out: Mat4) {
         out.set(CameraComponent.vf32.subarray(10 + CameraComponent.MEM_CURSOR * 27, 26 + CameraComponent.MEM_CURSOR * 27))

    }
    

   static get _componentId() {
        return CameraComponent.vi32[0 + CameraComponent.MEM_CURSOR * 27];
    } 
    
    static set _componentId(v: number) {
        CameraComponent.vi32[0 + CameraComponent.MEM_CURSOR * 27] = v;
    }}
