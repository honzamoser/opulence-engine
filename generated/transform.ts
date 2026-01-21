
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { constructor, hot } from "../component-gen";


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



type TransformComponentSignature = {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
    matrix: Mat4;
    _componentId: number;}

export class TransformComponent {
    static STRIDE: number = 108;
    static IDENTIFIER: number = 3;
    static DESCRIPTION: ComponentDescription = {"name":"TransformComponent","stride":108,"importStatement":"import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { constructor, hot } from \"../component-gen\";","properties":[{"name":"position","type":"f32[]","byteLength":12,"length":3,"offset":4,"jsType":"Vec3","default":"vec3.zero()"},{"name":"rotation","type":"f32[]","byteLength":12,"length":3,"offset":16,"jsType":"Vec3","default":"vec3.create(0, 0, 0)"},{"name":"scale","type":"f32[]","byteLength":12,"length":3,"offset":28,"jsType":"Vec3","default":"vec3.create(1, 1, 1)"},{"name":"matrix","type":"f32[]","byteLength":64,"length":16,"offset":40,"jsType":"Mat4","default":"mat4.identity()"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;

    declare _constructionFootprint: TransformComponentSignature;
    
	static vf32: Float32Array;
	static vi32: Int32Array;
	static vu8: Uint8Array;


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer) {
		TransformComponent.vf32 = new Float32Array(v)
		TransformComponent.vi32 = new Int32Array(v)
		TransformComponent.vu8 = new Uint8Array(v)


        TransformComponent.IS_INITIALIZED = true;
        TransformComponent.SET = new SparseSet();
    }
    static new(v: Partial<TransformComponentSignature>) {
        const elId = TransformComponent.NEXT;
    TransformComponent.NEXT += 1;
    const memId = TransformComponent.SET.add(elId);

        const constructionData: TransformComponentSignature = {
            position: v.position ? v.position : vec3.zero(),
rotation: v.rotation ? v.rotation : vec3.create(0, 0, 0),
scale: v.scale ? v.scale : vec3.create(1, 1, 1),
matrix: v.matrix ? v.matrix : mat4.identity(),
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = TransformComponent.MEM_CURSOR * 108;
    TransformComponent.vi32[base / 4] = memId;
    TransformComponent.MEM_CURSOR += 1;
    TransformComponent.vf32[base / 4 + 1 + 0] = constructionData.position[0];TransformComponent.vf32[base / 4 + 1 + 1] = constructionData.position[1];TransformComponent.vf32[base / 4 + 1 + 2] = constructionData.position[2];
TransformComponent.vf32[base / 4 + 4 + 0] = constructionData.rotation[0];TransformComponent.vf32[base / 4 + 4 + 1] = constructionData.rotation[1];TransformComponent.vf32[base / 4 + 4 + 2] = constructionData.rotation[2];
TransformComponent.vf32[base / 4 + 7 + 0] = constructionData.scale[0];TransformComponent.vf32[base / 4 + 7 + 1] = constructionData.scale[1];TransformComponent.vf32[base / 4 + 7 + 2] = constructionData.scale[2];
TransformComponent.vf32.set(constructionData.matrix, base / 4 + 10);

    

    return elId;
    }
        
    static delete() {
    //    if (TransformComponent.CURSOR < TransformComponent.SET.length) {
    //     TransformComponent.SET[TransformComponent.SET.length - 1] = TransformComponent.SET[TransformComponent.CURSOR]; 
    //     TransformComponent.SET[TransformComponent.CURSOR] = undefined;
    //     TransformComponent.MEM_CURSOR = TransformComponent.SET[TransformComponent.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        TransformComponent.SET.remove(TransformComponent.CURSOR);
    }
    

    static to(cId: number) {

        if (!TransformComponent.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        TransformComponent.MEM_CURSOR = TransformComponent.SET.getValue(cId);
        TransformComponent.CURSOR = cId;
        return TransformComponent;
    }

   static get position() {
        return TransformComponent.vf32.subarray(1 + TransformComponent.MEM_CURSOR * 27, 4 + TransformComponent.MEM_CURSOR * 27)
    } 

    static set position(v: Vec3) {
            TransformComponent.vf32[1 + TransformComponent.MEM_CURSOR * 27] = v[0]
TransformComponent.vf32[2 + TransformComponent.MEM_CURSOR * 27] = v[1]
TransformComponent.vf32[3 + TransformComponent.MEM_CURSOR * 27] = v[2]

        }

    static cpy_position(out: Vec3) {
          out[0] = TransformComponent.vf32[1 + TransformComponent.MEM_CURSOR * 27]
 out[1] = TransformComponent.vf32[2 + TransformComponent.MEM_CURSOR * 27]
 out[2] = TransformComponent.vf32[3 + TransformComponent.MEM_CURSOR * 27]

    }
    


            static get positionX () {
        return TransformComponent.vf32[1 + TransformComponent.MEM_CURSOR * 27];
            }

            static get positionY () {
        return TransformComponent.vf32[2 + TransformComponent.MEM_CURSOR * 27];
            }

            static get positionZ () {
        return TransformComponent.vf32[3 + TransformComponent.MEM_CURSOR * 27];
            }
        
               static get rotation() {
        return TransformComponent.vf32.subarray(4 + TransformComponent.MEM_CURSOR * 27, 7 + TransformComponent.MEM_CURSOR * 27)
    } 

    static set rotation(v: Vec3) {
            TransformComponent.vf32[4 + TransformComponent.MEM_CURSOR * 27] = v[0]
TransformComponent.vf32[5 + TransformComponent.MEM_CURSOR * 27] = v[1]
TransformComponent.vf32[6 + TransformComponent.MEM_CURSOR * 27] = v[2]

        }

    static cpy_rotation(out: Vec3) {
          out[0] = TransformComponent.vf32[4 + TransformComponent.MEM_CURSOR * 27]
 out[1] = TransformComponent.vf32[5 + TransformComponent.MEM_CURSOR * 27]
 out[2] = TransformComponent.vf32[6 + TransformComponent.MEM_CURSOR * 27]

    }
    


            static get rotationX () {
        return TransformComponent.vf32[4 + TransformComponent.MEM_CURSOR * 27];
            }

            static get rotationY () {
        return TransformComponent.vf32[5 + TransformComponent.MEM_CURSOR * 27];
            }

            static get rotationZ () {
        return TransformComponent.vf32[6 + TransformComponent.MEM_CURSOR * 27];
            }
        
               static get scale() {
        return TransformComponent.vf32.subarray(7 + TransformComponent.MEM_CURSOR * 27, 10 + TransformComponent.MEM_CURSOR * 27)
    } 

    static set scale(v: Vec3) {
            TransformComponent.vf32[7 + TransformComponent.MEM_CURSOR * 27] = v[0]
TransformComponent.vf32[8 + TransformComponent.MEM_CURSOR * 27] = v[1]
TransformComponent.vf32[9 + TransformComponent.MEM_CURSOR * 27] = v[2]

        }

    static cpy_scale(out: Vec3) {
          out[0] = TransformComponent.vf32[7 + TransformComponent.MEM_CURSOR * 27]
 out[1] = TransformComponent.vf32[8 + TransformComponent.MEM_CURSOR * 27]
 out[2] = TransformComponent.vf32[9 + TransformComponent.MEM_CURSOR * 27]

    }
    


            static get scaleX () {
        return TransformComponent.vf32[7 + TransformComponent.MEM_CURSOR * 27];
            }

            static get scaleY () {
        return TransformComponent.vf32[8 + TransformComponent.MEM_CURSOR * 27];
            }

            static get scaleZ () {
        return TransformComponent.vf32[9 + TransformComponent.MEM_CURSOR * 27];
            }
        
               static get matrix() {
        return TransformComponent.vf32.subarray(10 + TransformComponent.MEM_CURSOR * 27, 26 + TransformComponent.MEM_CURSOR * 27)
    } 

    static set matrix(v: Mat4) {
            TransformComponent.vf32.set(v, 10 + TransformComponent.MEM_CURSOR * 27)

        }

    static cpy_matrix(out: Mat4) {
         out.set(TransformComponent.vf32.subarray(10 + TransformComponent.MEM_CURSOR * 27, 26 + TransformComponent.MEM_CURSOR * 27))

    }
    

   static get _componentId() {
        return TransformComponent.vi32[0 + TransformComponent.MEM_CURSOR * 27];
    } 
    
    static set _componentId(v: number) {
        TransformComponent.vi32[0 + TransformComponent.MEM_CURSOR * 27] = v;
    }}
