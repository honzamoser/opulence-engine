
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";import { Component } from "../component";import { constructor, hot } from "../component-gen";


import { SparseSet } from "./index"

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
    static DESCRIPTION: ComponentDescription = {"name":"TransformComponent","stride":108,"importStatement":"import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";import { Component } from \"../component\";import { constructor, hot } from \"../component-gen\";","properties":[{"name":"position","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.zero()","view":"vf32","offset":4},{"name":"rotation","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(0, 0, 0)","view":"vf32","offset":16},{"name":"scale","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(1, 1, 1)","view":"vf32","offset":28},{"name":"matrix","byteLength":64,"arrayLength":16,"type":"Mat4","default":"mat4.identity()","view":"vf32","offset":40},{"name":"_componentId","byteLength":4,"offset":0,"type":"number","default":"0"}]}
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
    static new (v: Partial < TransformComponentSignature >) {
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

    TransformComponent.position = constructionData.position;
TransformComponent.rotation = constructionData.rotation;
TransformComponent.scale = constructionData.scale;
TransformComponent.matrix = constructionData.matrix;



return memId;
    }
        
    static delete () {
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
            return TransformComponent.vf32.subarray((4 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3)
    }
            
    static set position(v: Vec3 | Float32Array) {
        TransformComponent.vf32.set(v, (4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR);
    }
        
    static cpy_position(out: Vec3) {
        out.set(TransformComponent.vf32.subarray((4 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3));
    }
        
    static get positionX() {
        return TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0];
    }

    static set positionX(v: number) {
        TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0] = v;
    }
static get positionY() {
        return TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1];
    }

    static set positionY(v: number) {
        TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1] = v;
    }
static get positionZ() {
        return TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2];
    }

    static set positionZ(v: number) {
        TransformComponent.vf32[(4 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2] = v;
    }

static get rotation() {
            return TransformComponent.vf32.subarray((16 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3)
    }
            
    static set rotation(v: Vec3 | Float32Array) {
        TransformComponent.vf32.set(v, (16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR);
    }
        
    static cpy_rotation(out: Vec3) {
        out.set(TransformComponent.vf32.subarray((16 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3));
    }
        
    static get rotationX() {
        return TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0];
    }

    static set rotationX(v: number) {
        TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0] = v;
    }
static get rotationY() {
        return TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1];
    }

    static set rotationY(v: number) {
        TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1] = v;
    }
static get rotationZ() {
        return TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2];
    }

    static set rotationZ(v: number) {
        TransformComponent.vf32[(16 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2] = v;
    }

static get scale() {
            return TransformComponent.vf32.subarray((28 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3)
    }
            
    static set scale(v: Vec3 | Float32Array) {
        TransformComponent.vf32.set(v, (28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR);
    }
        
    static cpy_scale(out: Vec3) {
        out.set(TransformComponent.vf32.subarray((28 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 3));
    }
        
    static get scaleX() {
        return TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0];
    }

    static set scaleX(v: number) {
        TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 0] = v;
    }
static get scaleY() {
        return TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1];
    }

    static set scaleY(v: number) {
        TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 1] = v;
    }
static get scaleZ() {
        return TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2];
    }

    static set scaleZ(v: number) {
        TransformComponent.vf32[(28 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 2] = v;
    }

static get matrix() {
            return TransformComponent.vf32.subarray((40 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR, (40 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 16)
    }
            
    static set matrix(v: Mat4 | Float32Array) {
        TransformComponent.vf32.set(v, (40 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR);
    }
        
    static cpy_matrix(out: Mat4) {
        out.set(TransformComponent.vf32.subarray((40 / 4) + (108 / 4) * TransformComponent.MEM_CURSOR, (40 / 4) + 108 / 4 * TransformComponent.MEM_CURSOR + 16));
    }

static get _componentId() {
            return TransformComponent.vf32[0 + 108 * TransformComponent.MEM_CURSOR]
        } 
            
        static set _componentId(v: number) {
            TransformComponent.vf32[0 + 108 * TransformComponent.MEM_CURSOR] = v;
        }

}
