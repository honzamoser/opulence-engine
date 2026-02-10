
import { vec3, Vec3 } from "wgpu-matrix";import { constructor, hot } from "../component-gen";import { Component } from "../component";import { SizeOf } from "compiler/component_parsers";


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



type MeshComponentSignature = {
        resourceIdentifier: string;
    boundingBoxMin: Vec3;
    boundingBoxMax: Vec3;
    meshId: number;
    rendererdInstasnceId: number;
    _componentId: number;}

export class MeshComponent {
    static STRIDE: number = 104;
    static IDENTIFIER: number = 2;
    static DESCRIPTION: ComponentDescription = {"name":"MeshComponent","stride":104,"importStatement":"import { vec3, Vec3 } from \"wgpu-matrix\";import { constructor, hot } from \"../component-gen\";import { Component } from \"../component\";import { SizeOf } from \"compiler/component_parsers\";","properties":[{"byteLength":64,"type":"string","name":"resourceIdentifier","default":"\"\"","typeArgs":["string","64"],"view":"vu8","offset":4},{"name":"boundingBoxMin","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(\r\n    Number.POSITIVE_INFINITY,\r\n    Number.POSITIVE_INFINITY,\r\n    Number.POSITIVE_INFINITY,\r\n  )","view":"vf32","offset":68},{"name":"boundingBoxMax","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(\r\n    Number.NEGATIVE_INFINITY,\r\n    Number.NEGATIVE_INFINITY,\r\n    Number.NEGATIVE_INFINITY,\r\n  )","view":"vf32","offset":80},{"byteLength":4,"type":"number","name":"meshId","view":"vf32","default":0,"offset":92},{"byteLength":4,"type":"number","name":"rendererdInstasnceId","view":"vf32","default":0,"offset":96},{"name":"_componentId","byteLength":4,"offset":0,"type":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;
    static ALLOCATOR: Allocator;

    declare _constructionFootprint: MeshComponentSignature;
    
	static vf32: Float32Array; 
	static vi32: Int32Array; 
	static vu8: Uint8Array; 


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer, a: Allocator) {
		MeshComponent.vf32 = new Float32Array(v)
		MeshComponent.vi32 = new Int32Array(v)
		MeshComponent.vu8 = new Uint8Array(v)

        MeshComponent.ALLOCATOR = a;
        MeshComponent.IS_INITIALIZED = true;
        MeshComponent.SET = new SparseSet();
} 
    static new (v: Partial < MeshComponentSignature >) {
    const elId = MeshComponent.NEXT;
    
    MeshComponent.NEXT += 1;
    const memId = MeshComponent.SET.add(elId);

    MeshComponent.CURSOR = elId;
    MeshComponent.MEM_CURSOR = memId;

    const constructionData: MeshComponentSignature = {
        resourceIdentifier: v.resourceIdentifier ? v.resourceIdentifier : "",
boundingBoxMin: v.boundingBoxMin ? v.boundingBoxMin : vec3.create(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ),
boundingBoxMax: v.boundingBoxMax ? v.boundingBoxMax : vec3.create(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ),
meshId: v.meshId ? v.meshId : 0,
rendererdInstasnceId: v.rendererdInstasnceId ? v.rendererdInstasnceId : 0,
_componentId: v._componentId ? v._componentId : 0,
    }
const base = MeshComponent.MEM_CURSOR * 104;
    MeshComponent.vi32[base / 4] = memId;

    MeshComponent.resourceIdentifier = constructionData.resourceIdentifier;
MeshComponent.boundingBoxMin = constructionData.boundingBoxMin;
MeshComponent.boundingBoxMax = constructionData.boundingBoxMax;
MeshComponent.meshId = constructionData.meshId;
MeshComponent.rendererdInstasnceId = constructionData.rendererdInstasnceId;



return memId;
    }
        
    static delete () {
    //    if (MeshComponent.CURSOR < MeshComponent.SET.length) {
    //     MeshComponent.SET[MeshComponent.SET.length - 1] = MeshComponent.SET[MeshComponent.CURSOR]; 
    //     MeshComponent.SET[MeshComponent.CURSOR] = undefined;
    //     MeshComponent.MEM_CURSOR = MeshComponent.SET[MeshComponent.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        MeshComponent.SET.remove(MeshComponent.CURSOR);
}


    static to(cId: number) {

        if (!MeshComponent.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        MeshComponent.MEM_CURSOR = MeshComponent.SET.getValue(cId);
        MeshComponent.CURSOR = cId;
        return MeshComponent;
    } 

static get resourceIdentifier() {
            let str = "";
            for (let i = 0; i < 64; i++) {
                const charCode = MeshComponent.vu8[4 + 104 * MeshComponent.MEM_CURSOR + i];
                if (charCode === 0) break;
                str += String.fromCharCode(charCode);
            }
            return str;
        }
            
        static set resourceIdentifier(v: string) {
            for (let i = 0; i < 64; i++) {
                if(v[i]) {
                    MeshComponent.vu8[4 + 104 * MeshComponent.MEM_CURSOR + i] = v.charCodeAt(i);
                } else {
                    MeshComponent.vu8[4 + 104 * MeshComponent.MEM_CURSOR + i] = 0
                }
            }
        }
            
        static cpy_resourceIdentifier(out: Uint8Array) {
            out.set(MeshComponent.vu8, 4 + 104 * MeshComponent.MEM_CURSOR);
        }

static get boundingBoxMin() {
            return MeshComponent.vf32.subarray((68 / 4) + (104 / 4) * MeshComponent.MEM_CURSOR, (68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 3)
    }
            
    static set boundingBoxMin(v: Vec3 | Float32Array) {
        MeshComponent.vf32.set(v, (68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR);
    }
        
    static cpy_boundingBoxMin(out: Vec3) {
        out.set(MeshComponent.vf32.subarray((68 / 4) + (104 / 4) * MeshComponent.MEM_CURSOR, (68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 3));
    }
        
    static get boundingBoxMinX() {
        return MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 0];
    }

    static set boundingBoxMinX(v: number) {
        MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 0] = v;
    }
static get boundingBoxMinY() {
        return MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 1];
    }

    static set boundingBoxMinY(v: number) {
        MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 1] = v;
    }
static get boundingBoxMinZ() {
        return MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 2];
    }

    static set boundingBoxMinZ(v: number) {
        MeshComponent.vf32[(68 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 2] = v;
    }

static get boundingBoxMax() {
            return MeshComponent.vf32.subarray((80 / 4) + (104 / 4) * MeshComponent.MEM_CURSOR, (80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 3)
    }
            
    static set boundingBoxMax(v: Vec3 | Float32Array) {
        MeshComponent.vf32.set(v, (80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR);
    }
        
    static cpy_boundingBoxMax(out: Vec3) {
        out.set(MeshComponent.vf32.subarray((80 / 4) + (104 / 4) * MeshComponent.MEM_CURSOR, (80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 3));
    }
        
    static get boundingBoxMaxX() {
        return MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 0];
    }

    static set boundingBoxMaxX(v: number) {
        MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 0] = v;
    }
static get boundingBoxMaxY() {
        return MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 1];
    }

    static set boundingBoxMaxY(v: number) {
        MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 1] = v;
    }
static get boundingBoxMaxZ() {
        return MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 2];
    }

    static set boundingBoxMaxZ(v: number) {
        MeshComponent.vf32[(80 / 4) + 104 / 4 * MeshComponent.MEM_CURSOR + 2] = v;
    }

static get meshId() {
            return MeshComponent.vf32[23 + 104 * MeshComponent.MEM_CURSOR]
        } 
            
        static set meshId(v: number) {
            MeshComponent.vf32[23 + 104 * MeshComponent.MEM_CURSOR] = v;
        }

static get rendererdInstasnceId() {
            return MeshComponent.vf32[24 + 104 * MeshComponent.MEM_CURSOR]
        } 
            
        static set rendererdInstasnceId(v: number) {
            MeshComponent.vf32[24 + 104 * MeshComponent.MEM_CURSOR] = v;
        }

static get _componentId() {
            return MeshComponent.vf32[0 + 104 * MeshComponent.MEM_CURSOR]
        } 
            
        static set _componentId(v: number) {
            MeshComponent.vf32[0 + 104 * MeshComponent.MEM_CURSOR] = v;
        }

}
