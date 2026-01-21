
import { vec3, Vec3 } from "wgpu-matrix";import { constructor, hot } from "../component-gen";import { Component } from "../component";


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



type MeshComponentSignature = {
    meshId: number;
    rendererdInstasnceId: number;
    resourceIdentifier: string;
    boundingBoxMin: Vec3;
    boundingBoxMax: Vec3;
    _componentId: number;}

export class MeshComponent {
    static STRIDE: number = 104;
    static IDENTIFIER: number = 1;
    static DESCRIPTION: ComponentDescription = {"name":"MeshComponent","stride":104,"importStatement":"import { vec3, Vec3 } from \"wgpu-matrix\";import { constructor, hot } from \"../component-gen\";import { Component } from \"../component\";","properties":[{"name":"meshId","type":"f32","byteLength":4,"offset":4,"jsType":"number","default":"0"},{"name":"rendererdInstasnceId","type":"f32","byteLength":4,"offset":8,"jsType":"number","default":"0"},{"name":"resourceIdentifier","type":"char[]","byteLength":64,"offset":12,"pointer":false,"jsType":"string","default":""},{"name":"boundingBoxMin","type":"f32[]","byteLength":12,"length":3,"offset":76,"jsType":"Vec3","default":"vec3.create(\r\n    Number.POSITIVE_INFINITY,\r\n    Number.POSITIVE_INFINITY,\r\n    Number.POSITIVE_INFINITY,\r\n  )"},{"name":"boundingBoxMax","type":"f32[]","byteLength":12,"length":3,"offset":88,"jsType":"Vec3","default":"vec3.create(\r\n    Number.NEGATIVE_INFINITY,\r\n    Number.NEGATIVE_INFINITY,\r\n    Number.NEGATIVE_INFINITY,\r\n  )"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;

    declare _constructionFootprint: MeshComponentSignature;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer) {
		MeshComponent.vf32 = new Float32Array(v)
		MeshComponent.vi32 = new Int32Array(v)
		MeshComponent.vu8 = new Uint8Array(v)


        MeshComponent.IS_INITIALIZED = true;
        MeshComponent.SET = new SparseSet();
    }
    static new(v: Partial<MeshComponentSignature>) {
        const elId = MeshComponent.NEXT;
    MeshComponent.NEXT += 1;
    const memId = MeshComponent.SET.add(elId);

        const constructionData: MeshComponentSignature = {
            meshId: v.meshId ? v.meshId : 0,
rendererdInstasnceId: v.rendererdInstasnceId ? v.rendererdInstasnceId : 0,
resourceIdentifier: v.resourceIdentifier ? v.resourceIdentifier : ,
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
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = MeshComponent.MEM_CURSOR * 104;
    MeshComponent.vi32[base / 4] = memId;
    MeshComponent.MEM_CURSOR += 1;
    MeshComponent.vf32[base / 4 + 1 + 0] = constructionData.meshId;
MeshComponent.vf32[base / 4 + 2 + 0] = constructionData.rendererdInstasnceId;
MeshComponent.vu8[base / 1 + 12 + 0] = constructionData.resourceIdentifier;
MeshComponent.vf32[base / 4 + 19 + 0] = constructionData.boundingBoxMin[0];MeshComponent.vf32[base / 4 + 19 + 1] = constructionData.boundingBoxMin[1];MeshComponent.vf32[base / 4 + 19 + 2] = constructionData.boundingBoxMin[2];
MeshComponent.vf32[base / 4 + 22 + 0] = constructionData.boundingBoxMax[0];MeshComponent.vf32[base / 4 + 22 + 1] = constructionData.boundingBoxMax[1];MeshComponent.vf32[base / 4 + 22 + 2] = constructionData.boundingBoxMax[2];

    

    return elId;
    }
        
    static delete() {
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

   static get meshId() {
        return MeshComponent.vf32[1 + MeshComponent.MEM_CURSOR * 26];
    } 
    
    static set meshId(v: number) {
        MeshComponent.vf32[1 + MeshComponent.MEM_CURSOR * 26] = v;
    }   static get rendererdInstasnceId() {
        return MeshComponent.vf32[2 + MeshComponent.MEM_CURSOR * 26];
    } 
    
    static set rendererdInstasnceId(v: number) {
        MeshComponent.vf32[2 + MeshComponent.MEM_CURSOR * 26] = v;
    }   static get resourceIdentifier() {
        return MeshComponent.vchar.subarray(12 + MeshComponent.MEM_CURSOR * 104, 76 + MeshComponent.MEM_CURSOR * 104)
    } 

    static set resourceIdentifier(v: string) {
            MeshComponent.vchar.set(v, 12 + MeshComponent.MEM_CURSOR * 104)

        }

    static cpy_resourceIdentifier(out: string) {
         out.set(MeshComponent.vchar.subarray(12 + MeshComponent.MEM_CURSOR * 104, 76 + MeshComponent.MEM_CURSOR * 104))

    }
    

   static get boundingBoxMin() {
        return MeshComponent.vf32.subarray(19 + MeshComponent.MEM_CURSOR * 26, 22 + MeshComponent.MEM_CURSOR * 26)
    } 

    static set boundingBoxMin(v: Vec3) {
            MeshComponent.vf32[19 + MeshComponent.MEM_CURSOR * 26] = v[0]
MeshComponent.vf32[20 + MeshComponent.MEM_CURSOR * 26] = v[1]
MeshComponent.vf32[21 + MeshComponent.MEM_CURSOR * 26] = v[2]

        }

    static cpy_boundingBoxMin(out: Vec3) {
          out[0] = MeshComponent.vf32[19 + MeshComponent.MEM_CURSOR * 26]
 out[1] = MeshComponent.vf32[20 + MeshComponent.MEM_CURSOR * 26]
 out[2] = MeshComponent.vf32[21 + MeshComponent.MEM_CURSOR * 26]

    }
    


            static get boundingBoxMinX () {
        return MeshComponent.vf32[19 + MeshComponent.MEM_CURSOR * 26];
            }

            static get boundingBoxMinY () {
        return MeshComponent.vf32[20 + MeshComponent.MEM_CURSOR * 26];
            }

            static get boundingBoxMinZ () {
        return MeshComponent.vf32[21 + MeshComponent.MEM_CURSOR * 26];
            }
        
               static get boundingBoxMax() {
        return MeshComponent.vf32.subarray(22 + MeshComponent.MEM_CURSOR * 26, 25 + MeshComponent.MEM_CURSOR * 26)
    } 

    static set boundingBoxMax(v: Vec3) {
            MeshComponent.vf32[22 + MeshComponent.MEM_CURSOR * 26] = v[0]
MeshComponent.vf32[23 + MeshComponent.MEM_CURSOR * 26] = v[1]
MeshComponent.vf32[24 + MeshComponent.MEM_CURSOR * 26] = v[2]

        }

    static cpy_boundingBoxMax(out: Vec3) {
          out[0] = MeshComponent.vf32[22 + MeshComponent.MEM_CURSOR * 26]
 out[1] = MeshComponent.vf32[23 + MeshComponent.MEM_CURSOR * 26]
 out[2] = MeshComponent.vf32[24 + MeshComponent.MEM_CURSOR * 26]

    }
    


            static get boundingBoxMaxX () {
        return MeshComponent.vf32[22 + MeshComponent.MEM_CURSOR * 26];
            }

            static get boundingBoxMaxY () {
        return MeshComponent.vf32[23 + MeshComponent.MEM_CURSOR * 26];
            }

            static get boundingBoxMaxZ () {
        return MeshComponent.vf32[24 + MeshComponent.MEM_CURSOR * 26];
            }
        
               static get _componentId() {
        return MeshComponent.vi32[0 + MeshComponent.MEM_CURSOR * 26];
    } 
    
    static set _componentId(v: number) {
        MeshComponent.vi32[0 + MeshComponent.MEM_CURSOR * 26] = v;
    }}
