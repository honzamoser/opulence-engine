
import { vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { cold, constructor, hot } from "../component-gen";import {PointerTo, SizeOf} from "../../../compiler/component_parsers"


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



type RigidbodyComponentSignature = {
        velocity: Vec3;
    mass: number;
    isStatic: boolean;
    _componentId: number;}

export class RigidbodyComponent {
    static STRIDE: number = 28;
    static IDENTIFIER: number = 3;
    static DESCRIPTION: ComponentDescription = {"name":"RigidbodyComponent","stride":28,"importStatement":"import { vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { cold, constructor, hot } from \"../component-gen\";import {PointerTo, SizeOf} from \"../../../compiler/component_parsers\"","properties":[{"name":"velocity","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.zero()","view":"vf32","offset":4},{"byteLength":4,"type":"number","name":"mass","view":"vf32","default":0,"offset":16},{"name":"isStatic","byteLength":1,"type":"boolean","default":"false","view":"vu8","offset":20},{"name":"_componentId","byteLength":4,"offset":0,"type":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;
    static ALLOCATOR: Allocator;

    declare _constructionFootprint: RigidbodyComponentSignature;
    
	static vf32: Float32Array; 
	static vi32: Int32Array; 
	static vu8: Uint8Array; 


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer, a: Allocator) {
		RigidbodyComponent.vf32 = new Float32Array(v)
		RigidbodyComponent.vi32 = new Int32Array(v)
		RigidbodyComponent.vu8 = new Uint8Array(v)

        RigidbodyComponent.ALLOCATOR = a;
        RigidbodyComponent.IS_INITIALIZED = true;
        RigidbodyComponent.SET = new SparseSet();
} 
    static new (v: Partial < RigidbodyComponentSignature >) {
    const elId = RigidbodyComponent.NEXT;
    
    RigidbodyComponent.NEXT += 1;
    const memId = RigidbodyComponent.SET.add(elId);

    RigidbodyComponent.CURSOR = elId;
    RigidbodyComponent.MEM_CURSOR = memId;

    const constructionData: RigidbodyComponentSignature = {
        velocity: v.velocity ? v.velocity : vec3.zero(),
mass: v.mass ? v.mass : 0,
isStatic: v.isStatic ? v.isStatic : false,
_componentId: v._componentId ? v._componentId : 0,
    }
const base = RigidbodyComponent.MEM_CURSOR * 28;
    RigidbodyComponent.vi32[base / 4] = memId;

    RigidbodyComponent.velocity = constructionData.velocity;
RigidbodyComponent.mass = constructionData.mass;
RigidbodyComponent.isStatic = constructionData.isStatic;



return memId;
    }
        
    static delete () {
    //    if (RigidbodyComponent.CURSOR < RigidbodyComponent.SET.length) {
    //     RigidbodyComponent.SET[RigidbodyComponent.SET.length - 1] = RigidbodyComponent.SET[RigidbodyComponent.CURSOR]; 
    //     RigidbodyComponent.SET[RigidbodyComponent.CURSOR] = undefined;
    //     RigidbodyComponent.MEM_CURSOR = RigidbodyComponent.SET[RigidbodyComponent.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        RigidbodyComponent.SET.remove(RigidbodyComponent.CURSOR);
}


    static to(cId: number) {

        if (!RigidbodyComponent.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        RigidbodyComponent.MEM_CURSOR = RigidbodyComponent.SET.getValue(cId);
        RigidbodyComponent.CURSOR = cId;
        return RigidbodyComponent;
    } 

static get velocity() {
            return RigidbodyComponent.vf32.subarray((4 / 4) + (28 / 4) * RigidbodyComponent.MEM_CURSOR, (4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 3)
    }
            
    static set velocity(v: Vec3 | Float32Array) {
        RigidbodyComponent.vf32.set(v, (4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR);
    }
        
    static cpy_velocity(out: Vec3) {
        out.set(RigidbodyComponent.vf32.subarray((4 / 4) + (28 / 4) * RigidbodyComponent.MEM_CURSOR, (4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 3));
    }
        
    static get velocityX() {
        return RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 0];
    }

    static set velocityX(v: number) {
        RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 0] = v;
    }
static get velocityY() {
        return RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 1];
    }

    static set velocityY(v: number) {
        RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 1] = v;
    }
static get velocityZ() {
        return RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 2];
    }

    static set velocityZ(v: number) {
        RigidbodyComponent.vf32[(4 / 4) + 28 / 4 * RigidbodyComponent.MEM_CURSOR + 2] = v;
    }

static get mass() {
            return RigidbodyComponent.vf32[4 + 28 * RigidbodyComponent.MEM_CURSOR]
        } 
            
        static set mass(v: number) {
            RigidbodyComponent.vf32[4 + 28 * RigidbodyComponent.MEM_CURSOR] = v;
        }

static get isStatic() {
            return RigidbodyComponent.vu8[20 + 28 * RigidbodyComponent.MEM_CURSOR] === 1;
        }

        static set isStatic(v: boolean) {
            RigidbodyComponent.vu8[20 + 28 * RigidbodyComponent.MEM_CURSOR] = v ? 1 : 0;
        }

static get _componentId() {
            return RigidbodyComponent.vf32[0 + 28 * RigidbodyComponent.MEM_CURSOR]
        } 
            
        static set _componentId(v: number) {
            RigidbodyComponent.vf32[0 + 28 * RigidbodyComponent.MEM_CURSOR] = v;
        }

}
