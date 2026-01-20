
import { vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { cold, constructor, hot } from "../component-gen";import {PointerTo} from "../../../component_parsers"


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



type RigidbodyComponentSignature = {
    mass: number;
    velocity: Vec3;
    vertices: PointerTo<Float32Array>;
    _componentId: number;}

export class RigidbodyComponent {
    static STRIDE: number = 32;
    static IDENTIFIER: number = 3;
    static DESCRIPTION: ComponentDescription = {"name":"RigidbodyComponent","stride":32,"importStatement":"import { vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { cold, constructor, hot } from \"../component-gen\";import {PointerTo} from \"../../../component_parsers\"","properties":[{"name":"mass","type":"f32","byteLength":4,"offset":4,"jsType":"number","default":"1"},{"name":"velocity","type":"f32[]","byteLength":12,"length":3,"offset":8,"jsType":"Vec3","default":"vec3.zero()"},{"name":"vertices","type":"&f32[]","byteLength":8,"offset":20,"pointer":true,"jsType":"PointerTo<Float32Array>","default":"{ ptr: undefined, ptr_len: 0 }"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: number[] = [];
    static NEXT: number = 0;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: {vf32: Float32Array,vi32: Int32Array,vu8: Uint8Array}) {
		RigidbodyComponent.vf32 = v.vf32
		RigidbodyComponent.vi32 = v.vi32
		RigidbodyComponent.vu8 = v.vu8


        RigidbodyComponent.IS_INITIALIZED = true;
    }
    static new(v: Partial<RigidbodyComponentSignature>) {
        const memId = RigidbodyComponent.SET.length;
        RigidbodyComponent.SET[memId] = memId;

        const constructionData: RigidbodyComponentSignature = {
            mass: v.mass ? v.mass : 1,
velocity: v.velocity ? v.velocity : vec3.zero(),
vertices: v.vertices ? v.vertices : { ptr: undefined, ptr_len: 0 },
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = RigidbodyComponent.MEM_CURSOR * 32;
    RigidbodyComponent.vi32[base / 4] = memId;
    RigidbodyComponent.MEM_CURSOR += 1;
    RigidbodyComponent.vf32[base / 4 + 1 + 0] = constructionData.mass;
RigidbodyComponent.vf32[base / 4 + 2 + 0] = constructionData.velocity[0];RigidbodyComponent.vf32[base / 4 + 2 + 1] = constructionData.velocity[1];RigidbodyComponent.vf32[base / 4 + 2 + 2] = constructionData.velocity[2];
// throw new Error("Pointers are not yet implemented");

    
    }
        
    static delete() {
       if (RigidbodyComponent.CURSOR < RigidbodyComponent.SET.length) {
        RigidbodyComponent.SET[RigidbodyComponent.SET.length - 1] = RigidbodyComponent.SET[RigidbodyComponent.CURSOR]; 
        RigidbodyComponent.SET[RigidbodyComponent.CURSOR] = undefined;
        RigidbodyComponent.MEM_CURSOR = RigidbodyComponent.SET[RigidbodyComponent.CURSOR];
       } 

        // move data from last component in dense array to the deleted component's position
        if (RigidbodyComponent.SET.length > RigidbodyComponent.MEM_CURSOR) {
            const baseSrc = RigidbodyComponent.NEXT * 32;
            const baseDst = RigidbodyComponent.MEM_CURSOR * 32;

            // Copy data in vf32
            for (let i = 0; i < 120 / 4; i++) {
                RigidbodyComponent.vf32[baseDst / 4 + i] = RigidbodyComponent.vf32[baseSrc / 4 + i];
            }
        }
    }
    

    static to(cId: number) {

        if (RigidbodyComponent.SET[cId] == undefined) {
            throw new Error("Entity does not have this component");
        }

        RigidbodyComponent.MEM_CURSOR = RigidbodyComponent.SET[cId]
        RigidbodyComponent.CURSOR = cId;
        return RigidbodyComponent;
    }

   static get mass() {
        return RigidbodyComponent.vf32[1 + RigidbodyComponent.MEM_CURSOR * 8];
    } 
    
    static set mass(v: number) {
        RigidbodyComponent.vf32[1 + RigidbodyComponent.MEM_CURSOR * 8] = v;
    }   static get velocity() {
        return RigidbodyComponent.vf32.subarray(2 + RigidbodyComponent.MEM_CURSOR * 8, 5 + RigidbodyComponent.MEM_CURSOR * 8)
    } 

    static set velocity(v: Vec3) {
            RigidbodyComponent.vf32[2 + RigidbodyComponent.MEM_CURSOR * 8] = v[0]
RigidbodyComponent.vf32[3 + RigidbodyComponent.MEM_CURSOR * 8] = v[1]
RigidbodyComponent.vf32[4 + RigidbodyComponent.MEM_CURSOR * 8] = v[2]

        }

    static cpy_velocity(out: Vec3) {
          out[0] = RigidbodyComponent.vf32[2 + RigidbodyComponent.MEM_CURSOR * 8]
 out[1] = RigidbodyComponent.vf32[3 + RigidbodyComponent.MEM_CURSOR * 8]
 out[2] = RigidbodyComponent.vf32[4 + RigidbodyComponent.MEM_CURSOR * 8]

    }
    

   static get _componentId() {
        return RigidbodyComponent.vi32[0 + RigidbodyComponent.MEM_CURSOR * 8];
    } 
    
    static set _componentId(v: number) {
        RigidbodyComponent.vi32[0 + RigidbodyComponent.MEM_CURSOR * 8] = v;
    }}
