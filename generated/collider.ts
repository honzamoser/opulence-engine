
import { PointerTo } from "compiler/component_parsers";import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";


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



type ColliderComponentSignature = {
        matrix: Mat4;
    size: Vec3;
    offset: Vec3;
    boundingBoxMin: Vec3;
    boundingBoxMax: Vec3;
    vertices: PointerTo;
    indices: PointerTo;
    shapeType: number;
    _componentId: number;}

export class ColliderComponent {
    static STRIDE: number = 140;
    static IDENTIFIER: number = 1;
    static DESCRIPTION: ComponentDescription = {"name":"ColliderComponent","stride":140,"importStatement":"import { PointerTo } from \"compiler/component_parsers\";import { mat4, Mat4, vec3, Vec3 } from \"wgpu-matrix\";","properties":[{"name":"matrix","byteLength":64,"arrayLength":16,"type":"Mat4","default":"mat4.create()","view":"vf32","offset":4},{"name":"size","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(1, 1, 1)","view":"vf32","offset":68},{"name":"offset","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(0, 0, 0)","view":"vf32","offset":80},{"name":"boundingBoxMin","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(\r\n        Number.POSITIVE_INFINITY,\r\n        Number.POSITIVE_INFINITY,\r\n        Number.POSITIVE_INFINITY,\r\n    )","view":"vf32","offset":92},{"name":"boundingBoxMax","byteLength":12,"arrayLength":3,"type":"Vec3","default":"vec3.create(\r\n        Number.NEGATIVE_INFINITY,\r\n        Number.NEGATIVE_INFINITY,\r\n        Number.NEGATIVE_INFINITY,\r\n    )","view":"vf32","offset":104},{"name":"vertices","byteLength":8,"pointer":true,"type":"PointerTo","typeArgs":["Float32Array"],"default":null,"view":"vf32","offset":116},{"name":"indices","byteLength":8,"pointer":true,"type":"PointerTo","typeArgs":["Uint32Array"],"default":null,"view":"vu32","offset":124},{"byteLength":4,"type":"number","name":"shapeType","view":"vf32","default":"0","offset":132},{"name":"_componentId","byteLength":4,"offset":0,"type":"number","default":"0"}]}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;
    static ALLOCATOR: Allocator;

    declare _constructionFootprint: ColliderComponentSignature;
    
	static vf32: Float32Array; 
	static vi32: Int32Array; 
	static vu8: Uint8Array; 


    static IS_INITIALIZED: boolean = false; 
    static initialize(v: ArrayBuffer, a: Allocator) {
		ColliderComponent.vf32 = new Float32Array(v)
		ColliderComponent.vi32 = new Int32Array(v)
		ColliderComponent.vu8 = new Uint8Array(v)

        ColliderComponent.ALLOCATOR = a;
        ColliderComponent.IS_INITIALIZED = true;
        ColliderComponent.SET = new SparseSet();
} 
    static new (v: Partial < ColliderComponentSignature >) {
    const elId = ColliderComponent.NEXT;
    
    ColliderComponent.NEXT += 1;
    const memId = ColliderComponent.SET.add(elId);

    ColliderComponent.CURSOR = elId;
    ColliderComponent.MEM_CURSOR = memId;

    const constructionData: ColliderComponentSignature = {
        matrix: v.matrix ? v.matrix : mat4.create(),
size: v.size ? v.size : vec3.create(1, 1, 1),
offset: v.offset ? v.offset : vec3.create(0, 0, 0),
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
vertices: v.vertices ? v.vertices : null,
indices: v.indices ? v.indices : null,
shapeType: v.shapeType ? v.shapeType : 0,
_componentId: v._componentId ? v._componentId : 0,
    }
const base = ColliderComponent.MEM_CURSOR * 140;
    ColliderComponent.vi32[base / 4] = memId;

    ColliderComponent.matrix = constructionData.matrix;
ColliderComponent.size = constructionData.size;
ColliderComponent.offset = constructionData.offset;
ColliderComponent.boundingBoxMin = constructionData.boundingBoxMin;
ColliderComponent.boundingBoxMax = constructionData.boundingBoxMax;
if (constructionData.vertices !== null) {
                ColliderComponent.set_ptr_vertices(ColliderComponent.ALLOCATOR.alloc(constructionData.vertices.byteLength), constructionData.vertices.ptr_len);
                ColliderComponent.vertices = constructionData.vertices;
            } else {
                ColliderComponent.set_ptr_vertices(ColliderComponent.ALLOCATOR.alloc(64), 0);
}
if (constructionData.indices !== null) {
                ColliderComponent.set_ptr_indices(ColliderComponent.ALLOCATOR.alloc(constructionData.indices.byteLength), constructionData.indices.ptr_len);
                ColliderComponent.indices = constructionData.indices;
            } else {
                ColliderComponent.set_ptr_indices(ColliderComponent.ALLOCATOR.alloc(64), 0);
}
ColliderComponent.shapeType = constructionData.shapeType;



return memId;
    }
        
    static delete () {
    //    if (ColliderComponent.CURSOR < ColliderComponent.SET.length) {
    //     ColliderComponent.SET[ColliderComponent.SET.length - 1] = ColliderComponent.SET[ColliderComponent.CURSOR]; 
    //     ColliderComponent.SET[ColliderComponent.CURSOR] = undefined;
    //     ColliderComponent.MEM_CURSOR = ColliderComponent.SET[ColliderComponent.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        ColliderComponent.SET.remove(ColliderComponent.CURSOR);
}


    static to(cId: number) {

        if (!ColliderComponent.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        ColliderComponent.MEM_CURSOR = ColliderComponent.SET.getValue(cId);
        ColliderComponent.CURSOR = cId;
        return ColliderComponent;
    } 

static get matrix() {
            return ColliderComponent.vf32.subarray((4 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR, (4 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 16)
    }
            
    static set matrix(v: Mat4 | Float32Array) {
        ColliderComponent.vf32.set(v, (4 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR);
    }
        
    static cpy_matrix(out: Mat4) {
        out.set(ColliderComponent.vf32.subarray((4 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (4 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 16));
    }

static get size() {
            return ColliderComponent.vf32.subarray((68 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3)
    }
            
    static set size(v: Vec3 | Float32Array) {
        ColliderComponent.vf32.set(v, (68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR);
    }
        
    static cpy_size(out: Vec3) {
        out.set(ColliderComponent.vf32.subarray((68 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3));
    }
        
    static get sizeX() {
        return ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0];
    }

    static set sizeX(v: number) {
        ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0] = v;
    }
static get sizeY() {
        return ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1];
    }

    static set sizeY(v: number) {
        ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1] = v;
    }
static get sizeZ() {
        return ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2];
    }

    static set sizeZ(v: number) {
        ColliderComponent.vf32[(68 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2] = v;
    }

static get offset() {
            return ColliderComponent.vf32.subarray((80 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3)
    }
            
    static set offset(v: Vec3 | Float32Array) {
        ColliderComponent.vf32.set(v, (80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR);
    }
        
    static cpy_offset(out: Vec3) {
        out.set(ColliderComponent.vf32.subarray((80 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3));
    }
        
    static get offsetX() {
        return ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0];
    }

    static set offsetX(v: number) {
        ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0] = v;
    }
static get offsetY() {
        return ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1];
    }

    static set offsetY(v: number) {
        ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1] = v;
    }
static get offsetZ() {
        return ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2];
    }

    static set offsetZ(v: number) {
        ColliderComponent.vf32[(80 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2] = v;
    }

static get boundingBoxMin() {
            return ColliderComponent.vf32.subarray((92 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3)
    }
            
    static set boundingBoxMin(v: Vec3 | Float32Array) {
        ColliderComponent.vf32.set(v, (92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR);
    }
        
    static cpy_boundingBoxMin(out: Vec3) {
        out.set(ColliderComponent.vf32.subarray((92 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3));
    }
        
    static get boundingBoxMinX() {
        return ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0];
    }

    static set boundingBoxMinX(v: number) {
        ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0] = v;
    }
static get boundingBoxMinY() {
        return ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1];
    }

    static set boundingBoxMinY(v: number) {
        ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1] = v;
    }
static get boundingBoxMinZ() {
        return ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2];
    }

    static set boundingBoxMinZ(v: number) {
        ColliderComponent.vf32[(92 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2] = v;
    }

static get boundingBoxMax() {
            return ColliderComponent.vf32.subarray((104 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3)
    }
            
    static set boundingBoxMax(v: Vec3 | Float32Array) {
        ColliderComponent.vf32.set(v, (104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR);
    }
        
    static cpy_boundingBoxMax(out: Vec3) {
        out.set(ColliderComponent.vf32.subarray((104 / 4) + (140 / 4) * ColliderComponent.MEM_CURSOR, (104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 3));
    }
        
    static get boundingBoxMaxX() {
        return ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0];
    }

    static set boundingBoxMaxX(v: number) {
        ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 0] = v;
    }
static get boundingBoxMaxY() {
        return ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1];
    }

    static set boundingBoxMaxY(v: number) {
        ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 1] = v;
    }
static get boundingBoxMaxZ() {
        return ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2];
    }

    static set boundingBoxMaxZ(v: number) {
        ColliderComponent.vf32[(104 / 4) + 140 / 4 * ColliderComponent.MEM_CURSOR + 2] = v;
    }

static get vertices() {
            const ptr = ColliderComponent.vi32[116 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            const ptr_len = ColliderComponent.vi32[(116 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];

            return ColliderComponent.ALLOCATOR.get_mem_vf32(ptr, ptr_len);
    }

        static set vertices(v: Float32Array | Uint8Array) {
            let ptr = ColliderComponent.vi32[116 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            let ptr_len = ColliderComponent.vi32[(116 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            
            if (ptr === 0 || ptr_len !== v.byteLength) {
                if (ptr !== 0) {
                     ColliderComponent.ALLOCATOR.free(ptr, ptr_len);
                }
                
                ptr = ColliderComponent.ALLOCATOR.alloc(v.byteLength);
                ColliderComponent.vi32[116 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr;
                ColliderComponent.vi32[(116 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = v.byteLength;
                ptr_len = v.byteLength;
            }

            ColliderComponent.ALLOCATOR.get_mem_vf32(ptr, ptr_len).set(v);
    }

    static set_ptr_vertices(ptr: number, ptr_len: number) {
            ColliderComponent.vi32[116 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr;
            ColliderComponent.vi32[(116 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr_len;
    }
            

static get indices() {
            const ptr = ColliderComponent.vi32[124 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            const ptr_len = ColliderComponent.vi32[(124 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];

            return ColliderComponent.ALLOCATOR.get_mem_vu32(ptr, ptr_len);
    }

        static set indices(v: Float32Array | Uint8Array) {
            let ptr = ColliderComponent.vi32[124 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            let ptr_len = ColliderComponent.vi32[(124 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR];
            
            if (ptr === 0 || ptr_len !== v.byteLength) {
                if (ptr !== 0) {
                     ColliderComponent.ALLOCATOR.free(ptr, ptr_len);
                }
                
                ptr = ColliderComponent.ALLOCATOR.alloc(v.byteLength);
                ColliderComponent.vi32[124 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr;
                ColliderComponent.vi32[(124 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = v.byteLength;
                ptr_len = v.byteLength;
            }

            ColliderComponent.ALLOCATOR.get_mem_vu32(ptr, ptr_len).set(v);
    }

    static set_ptr_indices(ptr: number, ptr_len: number) {
            ColliderComponent.vi32[124 / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr;
            ColliderComponent.vi32[(124 + 4) / 4 + 140 / 4 * ColliderComponent.MEM_CURSOR] = ptr_len;
    }
            

static get shapeType() {
            return ColliderComponent.vf32[33 + 140 * ColliderComponent.MEM_CURSOR]
        } 
            
        static set shapeType(v: number) {
            ColliderComponent.vf32[33 + 140 * ColliderComponent.MEM_CURSOR] = v;
        }

static get _componentId() {
            return ColliderComponent.vf32[0 + 140 * ColliderComponent.MEM_CURSOR]
        } 
            
        static set _componentId(v: number) {
            ColliderComponent.vf32[0 + 140 * ColliderComponent.MEM_CURSOR] = v;
        }

}
