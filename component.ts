
import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix"


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
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
    matrix: Mat4;
    name: PointerTo<Uint8Array>;
    test: number;
    _componentId: number;}

export class RigidbodyComponent {
    static STRIDE: number = 120;
    static IDENTIFIER: number = 1;
    static DESCRIPTION: ComponentDescription = {"name":"RigidbodyComponent","stride":120,"importStatement":"import { Mat4, Vec3, mat4, vec3 } from \"wgpu-matrix\"","properties":[{"name":"position","type":"f32[]","byteLength":12,"length":3,"offset":4,"jsType":"Vec3","default":"vec3.zero()"},{"name":"rotation","type":"f32[]","byteLength":12,"length":3,"offset":16,"jsType":"Vec3","default":"vec3.zero()"},{"name":"scale","type":"f32[]","byteLength":12,"length":3,"offset":28,"jsType":"Vec3","default":"vec3.zero()"},{"name":"matrix","type":"f32[]","byteLength":64,"length":16,"offset":40,"jsType":"Mat4","default":"mat4.identity()"},{"name":"name","type":"&u8[]","byteLength":8,"offset":104,"pointer":true,"jsType":"PointerTo<Uint8Array>","default":"{ ptr: undefined, ptr_len: 0 }"},{"name":"test","type":"f32","byteLength":4,"offset":112,"jsType":"number","default":"0"},{"name":"_componentId","type":"i32","byteLength":4,"offset":0,"jsType":"number","default":"0"}]}
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
            position: v.position ? v.position : vec3.zero(),
rotation: v.rotation ? v.rotation : vec3.zero(),
scale: v.scale ? v.scale : vec3.zero(),
matrix: v.matrix ? v.matrix : mat4.identity(),
name: v.name ? v.name : { ptr: undefined, ptr_len: 0 },
test: v.test ? v.test : 0,
_componentId: v._componentId ? v._componentId : 0,
    }
    const base = RigidbodyComponent.MEM_CURSOR * 120;
    RigidbodyComponent.vi32[base / 4] = memId;
    RigidbodyComponent.MEM_CURSOR += 1;
    RigidbodyComponent.vf32[base / 4 + 1 + 0] = constructionData.position[0];RigidbodyComponent.vf32[base / 4 + 1 + 1] = constructionData.position[1];RigidbodyComponent.vf32[base / 4 + 1 + 2] = constructionData.position[2];
RigidbodyComponent.vf32[base / 4 + 4 + 0] = constructionData.rotation[0];RigidbodyComponent.vf32[base / 4 + 4 + 1] = constructionData.rotation[1];RigidbodyComponent.vf32[base / 4 + 4 + 2] = constructionData.rotation[2];
RigidbodyComponent.vf32[base / 4 + 7 + 0] = constructionData.scale[0];RigidbodyComponent.vf32[base / 4 + 7 + 1] = constructionData.scale[1];RigidbodyComponent.vf32[base / 4 + 7 + 2] = constructionData.scale[2];
RigidbodyComponent.vf32.set(constructionData.matrix, base / 4 + 10);
// throw new Error("Pointers are not yet implemented");
RigidbodyComponent.vf32[base / 4 + 28 + 0] = constructionData.test;

    
    }
        
    static delete() {
       if (RigidbodyComponent.CURSOR < RigidbodyComponent.SET.length) {
        RigidbodyComponent.SET[RigidbodyComponent.SET.length - 1] = RigidbodyComponent.SET[RigidbodyComponent.CURSOR]; 
        RigidbodyComponent.SET[RigidbodyComponent.CURSOR] = undefined;
        RigidbodyComponent.MEM_CURSOR = RigidbodyComponent.SET[RigidbodyComponent.CURSOR];
       } 

        // move data from last component in dense array to the deleted component's position
        if (RigidbodyComponent.SET.length > RigidbodyComponent.MEM_CURSOR) {
            const baseSrc = RigidbodyComponent.NEXT * 120;
            const baseDst = RigidbodyComponent.MEM_CURSOR * 120;

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

   static get position() {
        return RigidbodyComponent.vf32.subarray(1 + RigidbodyComponent.MEM_CURSOR * 30, 4 + RigidbodyComponent.MEM_CURSOR * 30)
    } 

    static set position(v: Vec3) {
            RigidbodyComponent.vf32[1 + RigidbodyComponent.MEM_CURSOR * 30] = v[0]
RigidbodyComponent.vf32[2 + RigidbodyComponent.MEM_CURSOR * 30] = v[1]
RigidbodyComponent.vf32[3 + RigidbodyComponent.MEM_CURSOR * 30] = v[2]

        }

    static cpy_position(out: Vec3) {
          out[0] = RigidbodyComponent.vf32[1 + RigidbodyComponent.MEM_CURSOR * 30]
 out[1] = RigidbodyComponent.vf32[2 + RigidbodyComponent.MEM_CURSOR * 30]
 out[2] = RigidbodyComponent.vf32[3 + RigidbodyComponent.MEM_CURSOR * 30]

    }
    

   static get rotation() {
        return RigidbodyComponent.vf32.subarray(4 + RigidbodyComponent.MEM_CURSOR * 30, 7 + RigidbodyComponent.MEM_CURSOR * 30)
    } 

    static set rotation(v: Vec3) {
            RigidbodyComponent.vf32[4 + RigidbodyComponent.MEM_CURSOR * 30] = v[0]
RigidbodyComponent.vf32[5 + RigidbodyComponent.MEM_CURSOR * 30] = v[1]
RigidbodyComponent.vf32[6 + RigidbodyComponent.MEM_CURSOR * 30] = v[2]

        }

    static cpy_rotation(out: Vec3) {
          out[0] = RigidbodyComponent.vf32[4 + RigidbodyComponent.MEM_CURSOR * 30]
 out[1] = RigidbodyComponent.vf32[5 + RigidbodyComponent.MEM_CURSOR * 30]
 out[2] = RigidbodyComponent.vf32[6 + RigidbodyComponent.MEM_CURSOR * 30]

    }
    

   static get scale() {
        return RigidbodyComponent.vf32.subarray(7 + RigidbodyComponent.MEM_CURSOR * 30, 10 + RigidbodyComponent.MEM_CURSOR * 30)
    } 

    static set scale(v: Vec3) {
            RigidbodyComponent.vf32[7 + RigidbodyComponent.MEM_CURSOR * 30] = v[0]
RigidbodyComponent.vf32[8 + RigidbodyComponent.MEM_CURSOR * 30] = v[1]
RigidbodyComponent.vf32[9 + RigidbodyComponent.MEM_CURSOR * 30] = v[2]

        }

    static cpy_scale(out: Vec3) {
          out[0] = RigidbodyComponent.vf32[7 + RigidbodyComponent.MEM_CURSOR * 30]
 out[1] = RigidbodyComponent.vf32[8 + RigidbodyComponent.MEM_CURSOR * 30]
 out[2] = RigidbodyComponent.vf32[9 + RigidbodyComponent.MEM_CURSOR * 30]

    }
    

   static get matrix() {
        return RigidbodyComponent.vf32.subarray(10 + RigidbodyComponent.MEM_CURSOR * 30, 26 + RigidbodyComponent.MEM_CURSOR * 30)
    } 

    static set matrix(v: Mat4) {
            RigidbodyComponent.vf32.set(v, 10 + RigidbodyComponent.MEM_CURSOR * 30)

        }

    static cpy_matrix(out: Mat4) {
         out.set(RigidbodyComponent.vf32.subarray(10 + RigidbodyComponent.MEM_CURSOR * 30, 26 + RigidbodyComponent.MEM_CURSOR * 30))

    }
    

   static get test() {
        return RigidbodyComponent.vf32[28 + RigidbodyComponent.MEM_CURSOR * 30];
    } 
    
    static set test(v: number) {
        RigidbodyComponent.vf32[28 + RigidbodyComponent.MEM_CURSOR * 30] = v;
    }   static get _componentId() {
        return RigidbodyComponent.vi32[0 + RigidbodyComponent.MEM_CURSOR * 30];
    } 
    
    static set _componentId(v: number) {
        RigidbodyComponent.vi32[0 + RigidbodyComponent.MEM_CURSOR * 30] = v;
    }}
