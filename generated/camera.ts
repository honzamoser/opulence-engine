
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { hot } from "../component-gen";


import { SparseSet } from "./index"
import {Allocator} from "../src/ecs/allocator";

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
        position: Float32Array;
    projectionMatrix: Mat4;
    rotation: Vec3;
    fov: number;
    near: number;
    far: number;
    _componentId: number;}

export class CameraComponent {
    static STRIDE: number = 160;
    static IDENTIFIER: number = 1;
    static DESCRIPTION: ComponentDescription = {"name":"CameraComponent","stride":160,"importStatement":"import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { hot } from \"../component-gen\";","properties":[{"name":"position","byteLength":64,"arrayLength":16,"default":"new Float32Array(16)","type":"Float32Array","view":"vf32","offset":4},{"name":"projectionMatrix","byteLength":64,"arrayLength":16,"type":"Mat4","default":"mat4.create()","view":"vf32","offset":68},{"name":"rotation","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.zero()","view":"vf32","offset":132},{"byteLength":4,"type":"number","name":"fov","view":"vf32","default":0,"offset":144},{"byteLength":4,"type":"number","name":"near","view":"vf32","default":0,"offset":148},{"byteLength":4,"type":"number","name":"far","view":"vf32","default":0,"offset":152},{"name":"_componentId","byteLength":4,"offset":0,"type":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;
    static ALLOCATOR: Allocator;

    declare _constructionFootprint: CameraComponentSignature;
    
	static vf32: Float32Array; 
	static vi32: Int32Array; 
	static vu8: Uint8Array; 


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer, a: Allocator) {
		CameraComponent.vf32 = new Float32Array(v)
		CameraComponent.vi32 = new Int32Array(v)
		CameraComponent.vu8 = new Uint8Array(v)

        CameraComponent.ALLOCATOR = a;
        CameraComponent.IS_INITIALIZED = true;
        CameraComponent.SET = new SparseSet();
} 
    static new (v: Partial < CameraComponentSignature >) {
    const elId = CameraComponent.NEXT;
    
    CameraComponent.NEXT += 1;
    const memId = CameraComponent.SET.add(elId);

    CameraComponent.CURSOR = elId;
    CameraComponent.MEM_CURSOR = memId;

    const constructionData: CameraComponentSignature = {
        position: v.position ? v.position : new Float32Array(16),
projectionMatrix: v.projectionMatrix ? v.projectionMatrix : mat4.create(),
rotation: v.rotation ? v.rotation : vec3.zero(),
fov: v.fov ? v.fov : 0,
near: v.near ? v.near : 0,
far: v.far ? v.far : 0,
_componentId: v._componentId ? v._componentId : 0,
    }
const base = CameraComponent.MEM_CURSOR * 160;
    CameraComponent.vi32[base / 4] = memId;

    CameraComponent.position = constructionData.position;
CameraComponent.projectionMatrix = constructionData.projectionMatrix;
CameraComponent.rotation = constructionData.rotation;
CameraComponent.fov = constructionData.fov;
CameraComponent.near = constructionData.near;
CameraComponent.far = constructionData.far;



return memId;
    }
        
    static delete () {
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

   static get position() {
        return CameraComponent.vFloat32Array.subarray(1 + CameraComponent.MEM_CURSOR * 40, 17 + CameraComponent.MEM_CURSOR * 40)
    } 

    static set position(v: undefined) {
            CameraComponent.vFloat32Array.set(v, 1 + CameraComponent.MEM_CURSOR * 40)

        }

    static cpy_position(out: undefined) {
         out.set(CameraComponent.vFloat32Array.subarray(1 + CameraComponent.MEM_CURSOR * 40, 17 + CameraComponent.MEM_CURSOR * 40))

    }

static get projectionMatrix() {
            return CameraComponent.vf32.subarray((68 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR, (68 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 16)
    }
            
    static set projectionMatrix(v: Mat4 | Float32Array) {
        CameraComponent.vf32.set(v, (68 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR);
    }
        
    static cpy_projectionMatrix(out: Mat4) {
        out.set(CameraComponent.vf32.subarray((68 / 4) + (160 / 4) * CameraComponent.MEM_CURSOR, (68 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 16));
    }

static get rotation() {
            return CameraComponent.vf32.subarray((132 / 4) + (160 / 4) * CameraComponent.MEM_CURSOR, (132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 3)
    }
            
    static set rotation(v: Vec3 | Float32Array) {
        CameraComponent.vf32.set(v, (132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR);
    }
        
    static cpy_rotation(out: Vec3) {
        out.set(CameraComponent.vf32.subarray((132 / 4) + (160 / 4) * CameraComponent.MEM_CURSOR, (132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 3));
    }
        
    static get rotationX() {
        return CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 0];
    }

    static set rotationX(v: number) {
        CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 0] = v;
    }
static get rotationY() {
        return CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 1];
    }

    static set rotationY(v: number) {
        CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 1] = v;
    }
static get rotationZ() {
        return CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 2];
    }

    static set rotationZ(v: number) {
        CameraComponent.vf32[(132 / 4) + 160 / 4 * CameraComponent.MEM_CURSOR + 2] = v;
    }

static get fov() {
            return CameraComponent.vf32[36 + 160 * CameraComponent.MEM_CURSOR]
        } 
            
        static set fov(v: number) {
            CameraComponent.vf32[36 + 160 * CameraComponent.MEM_CURSOR] = v;
        }

static get near() {
            return CameraComponent.vf32[37 + 160 * CameraComponent.MEM_CURSOR]
        } 
            
        static set near(v: number) {
            CameraComponent.vf32[37 + 160 * CameraComponent.MEM_CURSOR] = v;
        }

static get far() {
            return CameraComponent.vf32[38 + 160 * CameraComponent.MEM_CURSOR]
        } 
            
        static set far(v: number) {
            CameraComponent.vf32[38 + 160 * CameraComponent.MEM_CURSOR] = v;
        }

static get _componentId() {
            return CameraComponent.vf32[0 + 160 * CameraComponent.MEM_CURSOR]
        } 
            
        static set _componentId(v: number) {
            CameraComponent.vf32[0 + 160 * CameraComponent.MEM_CURSOR] = v;
        }

}
