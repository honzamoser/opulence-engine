
import { vec3, Vec3 } from "wgpu-matrix";import { constructor, hot } from "../component-gen";import { Component } from "../component";


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
    resourceIdentifier: PointerTo<Uint8Array>;
    boundingBoxMin: Vec3;
    boundingBoxMax: Vec3;
    _componentId: number;}

export class MeshComponent {
    static STRIDE: number = 48;
    static IDENTIFIER: number = 0;
    static DESCRIPTION: ComponentDescription = {"name":"MeshComponent","stride":48,"importStatement":"import { vec3, Vec3 } from \"wgpu-matrix\";import { constructor, hot } from \"../component-gen\";import { Component } from \"../component\";","properties":[{"name":"meshId","type":"f32","byteLength":4,"offset":4,"jsType":"number","default":"0"},{"name":"rendererdInstasnceId","type":"f32","byteLength":4,"offset":8,"jsType":"number","default":"0"},{"name":"resourceIdentifier","type":"&char[]","byteLength":8,"offset":12,"pointer":true,"jsType":"PointerTo<Uint8Array>","default":"{ ptr: undefined, ptr_len: 0 }"},{"name":"boundingBoxMin","type":"f32[]","byteLength":12,"length":3,"offset":20,"jsType":"Vec3","default":"vec3.create(\n    Number.POSITIVE_INFINITY,\n    Number.POSITIVE_INFINITY,\n    Number.POSITIVE_INFINITY,\n  )"},{"name":"boundingBoxMax","type":"f32[]","byteLength":12,"length":3,"offset":32,"jsType":"Vec3","default":"vec3.create(\n    Number.NEGATIVE_INFINITY,\n    Number.NEGATIVE_INFINITY,\n    Number.NEGATIVE_INFINITY,\n  )"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: number[] = [];
    static NEXT: number = 0;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: {vf32: Float32Array,vi32: Int32Array,vu8: Uint8Array}) {
		MeshComponent.vf32 = v.vf32
		MeshComponent.vi32 = v.vi32
		MeshComponent.vu8 = v.vu8


        MeshComponent.IS_INITIALIZED = true;
    }
    static new(v: Partial<MeshComponentSignature>) {
        const memId = MeshComponent.SET.length;
        MeshComponent.SET[memId] = memId;

        const constructionData: MeshComponentSignature = {
            meshId: v.meshId ? v.meshId : 0,
rendererdInstasnceId: v.rendererdInstasnceId ? v.rendererdInstasnceId : 0,
resourceIdentifier: v.resourceIdentifier ? v.resourceIdentifier : { ptr: undefined, ptr_len: 0 },
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
    const base = MeshComponent.MEM_CURSOR * 48;
    MeshComponent.vi32[base / 4] = memId;
    MeshComponent.MEM_CURSOR += 1;
    MeshComponent.vf32[base / 4 + 1 + 0] = constructionData.meshId;
MeshComponent.vf32[base / 4 + 2 + 0] = constructionData.rendererdInstasnceId;
// throw new Error("Pointers are not yet implemented");
MeshComponent.vf32[base / 4 + 5 + 0] = constructionData.boundingBoxMin[0];MeshComponent.vf32[base / 4 + 5 + 1] = constructionData.boundingBoxMin[1];MeshComponent.vf32[base / 4 + 5 + 2] = constructionData.boundingBoxMin[2];
MeshComponent.vf32[base / 4 + 8 + 0] = constructionData.boundingBoxMax[0];MeshComponent.vf32[base / 4 + 8 + 1] = constructionData.boundingBoxMax[1];MeshComponent.vf32[base / 4 + 8 + 2] = constructionData.boundingBoxMax[2];

    
    }
        
    static delete() {
       if (MeshComponent.CURSOR < MeshComponent.SET.length) {
        MeshComponent.SET[MeshComponent.SET.length - 1] = MeshComponent.SET[MeshComponent.CURSOR]; 
        MeshComponent.SET[MeshComponent.CURSOR] = undefined;
        MeshComponent.MEM_CURSOR = MeshComponent.SET[MeshComponent.CURSOR];
       } 

        // move data from last component in dense array to the deleted component's position
        if (MeshComponent.SET.length > MeshComponent.MEM_CURSOR) {
            const baseSrc = MeshComponent.NEXT * 48;
            const baseDst = MeshComponent.MEM_CURSOR * 48;

            // Copy data in vf32
            for (let i = 0; i < 120 / 4; i++) {
                MeshComponent.vf32[baseDst / 4 + i] = MeshComponent.vf32[baseSrc / 4 + i];
            }
        }
    }
    

    static to(cId: number) {

        if (MeshComponent.SET[cId] == undefined) {
            throw new Error("Entity does not have this component");
        }

        MeshComponent.MEM_CURSOR = MeshComponent.SET[cId]
        MeshComponent.CURSOR = cId;
        return MeshComponent;
    }

   static get meshId() {
        return MeshComponent.vf32[1 + MeshComponent.MEM_CURSOR * 12];
    } 
    
    static set meshId(v: number) {
        MeshComponent.vf32[1 + MeshComponent.MEM_CURSOR * 12] = v;
    }   static get rendererdInstasnceId() {
        return MeshComponent.vf32[2 + MeshComponent.MEM_CURSOR * 12];
    } 
    
    static set rendererdInstasnceId(v: number) {
        MeshComponent.vf32[2 + MeshComponent.MEM_CURSOR * 12] = v;
    }   static get boundingBoxMin() {
        return MeshComponent.vf32.subarray(5 + MeshComponent.MEM_CURSOR * 12, 8 + MeshComponent.MEM_CURSOR * 12)
    } 

    static set boundingBoxMin(v: Vec3) {
            MeshComponent.vf32[5 + MeshComponent.MEM_CURSOR * 12] = v[0]
MeshComponent.vf32[6 + MeshComponent.MEM_CURSOR * 12] = v[1]
MeshComponent.vf32[7 + MeshComponent.MEM_CURSOR * 12] = v[2]

        }

    static cpy_boundingBoxMin(out: Vec3) {
          out[0] = MeshComponent.vf32[5 + MeshComponent.MEM_CURSOR * 12]
 out[1] = MeshComponent.vf32[6 + MeshComponent.MEM_CURSOR * 12]
 out[2] = MeshComponent.vf32[7 + MeshComponent.MEM_CURSOR * 12]

    }
    

   static get boundingBoxMax() {
        return MeshComponent.vf32.subarray(8 + MeshComponent.MEM_CURSOR * 12, 11 + MeshComponent.MEM_CURSOR * 12)
    } 

    static set boundingBoxMax(v: Vec3) {
            MeshComponent.vf32[8 + MeshComponent.MEM_CURSOR * 12] = v[0]
MeshComponent.vf32[9 + MeshComponent.MEM_CURSOR * 12] = v[1]
MeshComponent.vf32[10 + MeshComponent.MEM_CURSOR * 12] = v[2]

        }

    static cpy_boundingBoxMax(out: Vec3) {
          out[0] = MeshComponent.vf32[8 + MeshComponent.MEM_CURSOR * 12]
 out[1] = MeshComponent.vf32[9 + MeshComponent.MEM_CURSOR * 12]
 out[2] = MeshComponent.vf32[10 + MeshComponent.MEM_CURSOR * 12]

    }
    

   static get _componentId() {
        return MeshComponent.vi32[0 + MeshComponent.MEM_CURSOR * 12];
    } 
    
    static set _componentId(v: number) {
        MeshComponent.vi32[0 + MeshComponent.MEM_CURSOR * 12] = v;
    }}
