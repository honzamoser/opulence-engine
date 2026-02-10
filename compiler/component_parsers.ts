import { writeFileSync, readFileSync } from "fs";
import * as path from "path";
import { cwd } from "process";
import { glob } from "node:fs/promises";
import { typedArray } from "./typeHandlers/typedArray"
import { ClassDeclaration, Identifier, Project, PropertyDeclaration, SyntaxKind, TypedNode, TypeNode } from "ts-morph"

const OUT_PATH = "./"

const TYPED_ARRAYS = [
    "Float64Array",
    "Float32Array",
    "Uint32Array",
    "Int32Array",
    "Int16Array",
    "Uint16Array",
    "Int8Array",
    "Uint8Array",
]

const COMPONENT_DIRS = [
    "./src/ecs/components/**.component.ts"
]

const SPARSE_SET_DEF = `export class SparseSet {
    // Stores the actual values (Entity IDs) tightly packed
    // O(1) to get Value from Index (dense[i])
    dense: number[] = [];

    // Maps the Value to its Index in the dense array
    // O(1) to get Index from Value (sparse[val])
    // If your values are huge integers, use a Map<number, number> instead of an array.
    sparse: number[] = []; 

    add(value: number) {
        if (this.contains(value)) return;

        this.dense.push(value);
        this.sparse[value] = this.dense.length - 1;

        return this.sparse[value];
    }

    contains(value: number): boolean {
        // Checks if value exists and points to valid data
        const index = this.sparse[value];
        return index < this.dense.length && this.dense[index] === value;
    }

    /* O(1) Removal (The Swap-Pop trick) */
    remove(value: number) {
        if (!this.contains(value)) return;

        const indexToDelete = this.sparse[value];
        const lastElement = this.dense[this.dense.length - 1];

        // 1. Overwrite the element to delete with the last element
        this.dense[indexToDelete] = lastElement;

        // 2. Update the sparse map for the swapped element
        this.sparse[lastElement] = indexToDelete;

        // 3. Remove the last element
        this.dense.pop();
        
        // Optional: clear the sparse slot (not strictly necessary but cleaner)
        this.sparse[value] = undefined; 
    }
    
    getIndex(value: number) {
        return this.sparse[value];
    }
    
    getValue(index: number) {
        return this.dense[index];
    }
}`

const TYPED_ARRAY_SIZES: { [key: string]: number } = {
    "Float64Array": 8,
    "Float32Array": 4,
    "Uint32Array": 4,
    "Int32Array": 4,
    "Int16Array": 2,
    "Uint16Array": 2,
    "Int8Array": 1,
    "Uint8Array": 1,
}

export type SizeOf<T extends string | Float64Array |
    Float32Array |
    Uint32Array |
    Int32Array |
    Int16Array |
    Uint16Array |
    Int8Array |
    Uint8Array, Y extends number> = T
export type PointerTo<T> = {
    ptr: number | undefined,
    ptr_len: number
}

type ComponentDescription = {
    name: string,
    stride: number,
    importStatement: string,
    properties: PropertyDefinition[],
}

export type TypeTransformer = (c: ComponentDescription, p: PropertyDefinition) => string;

const target_path = path.join(cwd(), OUT_PATH);

const typeTransformers: { [key: string | RegExp]: TypeTransformer } = {
    "number": (c, p) => {
        return `static get ${p.name}() {
            return ${c.name}.vf32[${p.offset / 4} + ${c.stride} * ${c.name}.MEM_CURSOR]
        } 
            
        static set ${p.name}(v: number) {
            ${c.name}.vf32[${p.offset / 4} + ${c.stride} * ${c.name}.MEM_CURSOR] = v;
        }`
    },

    "string": (c, p) => {
        return `static get ${p.name}() {
            let str = "";
            for (let i = 0; i < 64; i++) {
                const charCode = ${c.name}.vu8[${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR + i];
                if (charCode === 0) break;
                str += String.fromCharCode(charCode);
            }
            return str;
        }
            
        static set ${p.name}(v: string) {
            for (let i = 0; i < 64; i++) {
                if(v[i]) {
                    ${c.name}.vu8[${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR + i] = v.charCodeAt(i);
                } else {
                    ${c.name}.vu8[${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR + i] = 0
                }
            }
        }
            
        static cpy_${p.name}(out: Uint8Array) {
            out.set(${c.name}.vu8, ${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR);
        }`
    },

    ...TYPED_ARRAYS.reduce((acc, arr) => {
        acc[arr] = typedArray;
        return acc;
    }, {} as { [key: string]: TypeTransformer }),

    "SizeOf": (c, p) => {
        if (p.typeArgs && p.typeArgs.length == 2) {
            p.byteLength = parseInt(p.typeArgs[1]);
        }

        return typeTransformers[p.typeArgs[0]](c, p);
    },

    "PointerTo": (c, p) => {
        return `static get ${p.name}() {
            const ptr = ${c.name}.vi32[${p.offset} / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR];
            const ptr_len = ${c.name}.vi32[(${p.offset} + 4) / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR];

            return ${c.name}.ALLOCATOR.get_mem_${getCorrectView(p.typeArgs[0])}(ptr, ptr_len);
    }

        static set ${p.name}(v: Float32Array | Uint8Array) {
            let ptr = ${c.name}.vi32[${p.offset} / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR];
            let ptr_len = ${c.name}.vi32[(${p.offset} + 4) / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR];
            
            if (ptr === 0 || ptr_len !== v.byteLength) {
                if (ptr !== 0) {
                     ${c.name}.ALLOCATOR.free(ptr, ptr_len);
                }
                
                ptr = ${c.name}.ALLOCATOR.alloc(v.byteLength);
                ${c.name}.vi32[${p.offset} / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR] = ptr;
                ${c.name}.vi32[(${p.offset} + 4) / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR] = v.byteLength;
                ptr_len = v.byteLength;
            }

            ${c.name}.ALLOCATOR.get_mem_${getCorrectView(p.typeArgs[0])}(ptr, ptr_len).set(v);
    }

    static set_ptr_${p.name}(ptr: number, ptr_len: number) {
            ${c.name}.vi32[${p.offset} / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR] = ptr;
            ${c.name}.vi32[(${p.offset} + 4) / 4 + ${c.stride} / 4 * ${c.name}.MEM_CURSOR] = ptr_len;
    }
            `
    },

    "Vec3": (c, p) => {
        return `static get ${p.name}() {
            return ${c.name}.vf32.subarray((${p.offset} / 4) + (${c.stride} / 4) * ${c.name}.MEM_CURSOR, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + 3)
    }
            
    static set ${p.name}(v: Vec3 | Float32Array) {
        ${c.name}.vf32.set(v, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR);
    }
        
    static cpy_${p.name}(out: Vec3) {
        out.set(${c.name}.vf32.subarray((${p.offset} / 4) + (${c.stride} / 4) * ${c.name}.MEM_CURSOR, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + 3));
    }
        
    ${["X", "Y", "Z"].map((axis, i) => {
            return `static get ${p.name}${axis}() {
        return ${c.name}.vf32[(${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + ${i}];
    }

    static set ${p.name}${axis}(v: number) {
        ${c.name}.vf32[(${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + ${i}] = v;
    }`
        }).join("\n")}`
    },

    "Mat4": (c, p) => {
        return `static get ${p.name}() {
            return ${c.name}.vf32.subarray((${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + 16)
    }
            
    static set ${p.name}(v: Mat4 | Float32Array) {
        ${c.name}.vf32.set(v, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR);
    }
        
    static cpy_${p.name}(out: Mat4) {
        out.set(${c.name}.vf32.subarray((${p.offset} / 4) + (${c.stride} / 4) * ${c.name}.MEM_CURSOR, (${p.offset} / 4) + ${c.stride} / 4 * ${c.name}.MEM_CURSOR + 16));
    }`
    },
    "boolean": (c, p) => {
        return `static get ${p.name}() {
            return ${c.name}.vu8[${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR] === 1;
        }

        static set ${p.name}(v: boolean) {
            ${c.name}.vu8[${p.offset} + ${c.stride} * ${c.name}.MEM_CURSOR] = v ? 1 : 0;
        }`
    }


}



const typeMap: { [key: string]: PropertyDefinition } = {
    "number": {
        name: null,
        type: "f32",
        byteLength: 4,
        offset: null,
        type: "number",
        default: "0"
    },
    "Vec3": {
        name: null,
        type: "f32[]",
        byteLength: 12,
        length: 3,
        offset: null,
        type: "Vec3",
        default: "vec3.zero()"
    },
    "Mat4": {
        name: null,
        type: "f32[]",
        byteLength: 64,
        length: 16,
        offset: null,
        type: "Mat4",
        default: "mat4.identity()"
    },
    "PointerTo<Uint8Array>": {
        name: null,
        type: "&u8[]",
        byteLength: 8,
        offset: null,
        pointer: true,
        type: "PointerTo<Uint8Array>",
        default: "{ ptr: undefined, ptr_len: 0 }"
    },
    "PointerTo": {
        name: null,
        type: "&f32[]",
        byteLength: 8,
        offset: null,
        pointer: true,
        type: "PointerTo",
        default: "{ ptr: undefined, ptr_len: 0 }"
    },
    "string": {
        name: null,
        type: "u8[]",
        byteLength: 64,
        offset: null,
        pointer: false,
        type: "string",
        default: ""
    },
    "Float32Array": {
        name: null,
        type: "f32[]",
        byteLength: 0, // to be filled
        offset: null,
        type: "Float32Array",
        default: "new Float32Array(16)"
    },
    "SizeOf": {
        name: null,
        type: "SizeOf",
        byteLength: 0,
        offset: null,
        type: "SizeOf",
        default: "undefined"
    },
    "boolean": {
        name: null,
        type: "boolean",
        byteLength: 1,
        offset: null,
        default: "false",
        view: "vu8",
    }
}

const propertyDecoders = new Map<string, (p: PropertyDeclaration, t?: string[]) => Omit<PropertyDefinition, "offset">>();

propertyDecoders.set("number", (p: PropertyDeclaration) => {
    return {
        byteLength: 4,
        type: "number",
        name: p.getName(),
        view: "vf32",
        default: 0
    }
})

propertyDecoders.set("string", (p: PropertyDeclaration) => {
    // Step 1: Check if string has default value
    const initializer = p.getInitializer()?.getText();
    let len = 64; // default length
    if (initializer) {
        len = initializer.length
    }
    return {
        byteLength: len,
        type: "string",
        name: p.getName(),
        default: initializer ? initializer : '""',
        view: "vu8",
    }
});

propertyDecoders.set("SizeOf", (p: PropertyDeclaration, t?: string[]) => {
    const type = t[0];
    const length = parseInt(t[1]);

    const initializer = getInitializer(p);

    return {
        byteLength: length,
        type: type,
        name: p.getName(),
        default: initializer ? initializer : type === "string" ? `""` : `new ${type} (${length})`,
        typeArgs: [type, t[1]],
        view: getCorrectView(type),
    }

})

for (const arr of TYPED_ARRAYS) {
    propertyDecoders.set(arr, (p: PropertyDeclaration) => {
        const initializer = p.getInitializer();
        const children = initializer.getChildren();

        // console.log((children[1] as Identifier).getType().getText())
        // console.log(arr + "Constructor")
        // console.log(children[0].getKindName())
        // console.log(children[3].getText())

        if (children[0].isKind(SyntaxKind.NewKeyword) && (children[1] as Identifier).getType().getText() == arr + "Constructor") {
            const len = parseInt(children[3].getText());
            return {
                name: p.getName(),
                byteLength: TYPED_ARRAY_SIZES[arr] * len,
                arrayLength: len,
                default: initializer.getText(),
                type: arr,
                view: getCorrectView(arr),
            }
        } else {
            throw new Error(`Typed Array ${arr} must be initialized with 'new ${arr}(length)' or be used with type SizeOf < ${arr}, length > `);
        }
    })
}

propertyDecoders.set("Vec3", (p: PropertyDeclaration) => {
    const intializer = getInitializer(p);

    return {
        name: p.getName(),
        byteLength: 12,
        arrayLength: 3,
        type: "Vec3",
        default: intializer ? intializer : "vec3.zero()",
        view: "vf32",
    }
})

propertyDecoders.set("Mat4", (p: PropertyDeclaration) => {
    const intializer = getInitializer(p);

    return {
        name: p.getName(),
        byteLength: 64,
        arrayLength: 16,
        type: "Mat4",
        default: intializer ? intializer : "mat4.identity()",
        view: "vf32",
    }
});

propertyDecoders.set("PointerTo", (p: PropertyDeclaration, t: string[]) => {
    const type = t[0];

    const initializer = getInitializer(p);
    return {
        name: p.getName(),
        byteLength: 8,
        pointer: true,
        type: "PointerTo",
        typeArgs: [type],
        default: initializer ? initializer : null,
        view: getCorrectView(type),
    };
})

propertyDecoders.set("boolean", (p: PropertyDeclaration) => {
    return {
        name: p.getName(),
        byteLength: 1,
        type: "boolean",
        default: "false",
        view: "vu8",
    }
});




function parseComponent(code: string) {
    const t_project = new Project({
        useInMemoryFileSystem: true,
    })
    t_project.createSourceFile("component.ts", code);

    const sourceFile = t_project.getSourceFileOrThrow("component.ts");

    const components = sourceFile.getClasses().map((c) => {
        return parseClass(c);
    });

    console.log(components[0].stride)

    return components[0];
}

function parseClass(cls: ClassDeclaration): ComponentDescription {
    console.log(`Component: ${cls.getName()} `);

    let offset = 4;

    const properties = cls.getProperties().map((p) => {
        let propDef = { ...parseProperty(p) };

        if (p.getName() === "_componentId") {
            throw new Error("_componentId is a reserved property name");
        }


        return propDef;
    });

    properties.sort((a, b) => b.byteLength - a.byteLength);
    properties.forEach((p) => {
        p.offset = offset;
        offset += p.byteLength;
    });

    const entityIdProperty: PropertyDefinition = {
        name: "_componentId",
        byteLength: 4,
        offset: 0,
        type: "number",
        default: "0"
    }

    return {
        name: cls.getNameOrThrow(),
        stride: padded(properties[properties.length - 1].offset + properties[properties.length - 1].byteLength + 4),
        importStatement: getImportStatement(cls),
        properties: [...properties, entityIdProperty],
    }
}

function padded(s: number) {
    return s % 4 === 0 ? s : s + (4 - (s % 4));
}

function getImportStatement(cls: ClassDeclaration): string {
    const sourceFile = cls.getSourceFile();
    const filePath = sourceFile.getFilePath();

    const imports = sourceFile.getImportDeclarations();

    let importStatement = "";

    imports.forEach((imp) => {

        const importPath = imp.getModuleSpecifier().getText();
        if (importPath.startsWith(".") || importPath.startsWith("/")) {
            const pathFromModule = path.join(filePath, importPath);
            const pathFromOutput = path.relative(target_path, pathFromModule);
            importStatement += `import { ${imp.getNamedImports().map(x => x.getName()).join(", ")}
    } from "${pathFromOutput}"; \n`;
        } else {
            importStatement += imp.getText();
        }
    })

    return importStatement;
}

function getInitializer(p: PropertyDeclaration) {
    return p.getInitializer()?.getText();
}

function parseProperty(p: PropertyDeclaration): Omit<PropertyDefinition, "offset"> {
    const typeNode = p.getTypeNodeOrThrow();
    const typeStructure = recuresiveTypeParse(typeNode);

    console.log("t:", typeStructure)

    const matchType = propertyDecoders.get(typeStructure[0])?.(p, typeStructure.splice(1));
    matchType.default = getInitializer(p) ? getInitializer(p) : matchType.default;

    if (!matchType)
        throw new Error(`Type ${typeStructure[0]} is not supported`);
    return structuredClone(matchType)
}

function recuresiveTypeParse(typeNode: TypeNode): string[] {
    const children = typeNode.getChildren();

    if (children.length == 0) {
        return [typeNode.getText()]
    }

    if (children.length == 1) {
        if (children[0].getChildCount() > 0) {
            return [...recuresiveTypeParse(children[0] as TypeNode)];
        }
        return [typeNode.getText()];
    } else {
        let res: string[] = []
        for (let i = 0; i < children.length; i++) {
            if (children[i].getChildCount() > 0) {
                res = [...res, ...recuresiveTypeParse(children[i] as TypeNode)]
            } else {
                if (!(children[i].isKind(SyntaxKind.LessThanToken) || children[i].isKind(SyntaxKind.GreaterThanToken) || children[i].isKind(SyntaxKind.CommaToken))) {
                    res = [...res, children[i].getText()];
                }
            }
        }
        return res;
    }
}

type PropertyType = "u8" | "i16" | "u16" | "i32" | "u32" | "f32" | "char" | "Vec2" | "Vec3" | "Mat3" | "Mat4"
    | "u8[]" | "i16[]" | "u16[]" | "i32[]" | "u32[]" | "f32[]" | "char[]" | "&u8[]" | "&i16[]" | "&u16[]" | "&i32[]" | "&u32[]" | "&f32[]" | "&char[]";

export type PropertyDefinition = {
    name: string,
    type: string,
    byteLength: number,
    offset: number,
    view: "vf32" | "vi32" | "vu8",

    arrayLength?: number,
    pointer?: boolean,
    default?: string,
    typeArgs?: string[]
}

const COMPONENT_BOILERPLATE = (c: ComponentDescription) => `
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

`

const views = {
    "vf32": "Float32Array",
    "vi32": "Int32Array",
    "vu8": "Uint8Array",
}

function generateViewsCode() {
    return Object.keys(views).map(x => {
        return `\tstatic ${x}: ${views[x]}; \n`
    }).join("")

    //TODO: ref views (pointers)
}

function generateInitializator(c: ComponentDescription) {
    return `static initialize(v: ArrayBuffer, a: Allocator) {
${Object.keys(views).map(x => {
        return `\t\t${c.name}.${x} = new ${views[x]}(v)\n`
    }).join("")
        }
        ${c.name}.ALLOCATOR = a;
        ${c.name}.IS_INITIALIZED = true;
        ${c.name}.SET = new SparseSet();
} `
}

function generateComponentConstructionSignature(c: ComponentDescription) {
    return `type ${c.name}Signature = {
    ${c.properties.map(p => {
        return `    ${p.name}: ${p.type};`
    }).join("\n")
        }}`
}

function getCorrectView(type: string) {
    type = type.replace("&", "").replace("[]", "");
    if (type.endsWith("32")) {
        return "vf32";
    } else if (type.endsWith("16")) {
        return "vi16";
    } else if (type.endsWith("8") || type.startsWith("char")) {
        return "vu8";
    }

    switch (type) {
        case "number":
        case "Vec3":
        case "Mat4":
        case "Float32Array":
            return "vf32";
        case "Int32Array":
            return "vi32";
        case "Uint32Array":
            return "vu32";
        case "string":
        case "Int8Array":
            return "vu8";
        default:
            throw new Error(`Type ${type} does not have a corresponding view`);
    }
}

function generateComponentConstructor(c: ComponentDescription) {
    return `static new (v: Partial < ${c.name}Signature >) {
    const elId = ${c.name}.NEXT;
    
    ${c.name}.NEXT += 1;
    const memId = ${c.name}.SET.add(elId);

    ${c.name}.CURSOR = elId;
    ${c.name}.MEM_CURSOR = memId;

    const constructionData: ${c.name}Signature = {
        ${c.properties.map(p => {
        return `${p.name}: v.${p.name} ? v.${p.name} : ${p.default},`;
    }).join("\n")
        }
    }
const base = ${c.name}.MEM_CURSOR * ${c.stride};
    ${c.name}.vi32[base / 4] = memId;

    ${c.properties.map(x => {
            if (x.name === "_componentId") {
                return "";
            }

            let out = ""
            if (!x.pointer) {
                out += `${c.name}.${x.name} = constructionData.${x.name};`
            } else {
                out += `if (constructionData.${x.name} !== null) {
                ${c.name}.set_ptr_${x.name}(${c.name}.ALLOCATOR.alloc(constructionData.${x.name}.byteLength), constructionData.${x.name}.ptr_len);
                ${c.name}.${x.name} = constructionData.${x.name};
            } else {
                ${c.name}.set_ptr_${x.name}(${c.name}.ALLOCATOR.alloc(64), 0);
}`
            }
            return out;
        }).join("\n")
        }


return memId;
    }
        
    static delete () {
    //    if (${c.name}.CURSOR < ${c.name}.SET.length) {
    //     ${c.name}.SET[${c.name}.SET.length - 1] = ${c.name}.SET[${c.name}.CURSOR]; 
    //     ${c.name}.SET[${c.name}.CURSOR] = undefined;
    //     ${c.name}.MEM_CURSOR = ${c.name}.SET[${c.name}.CURSOR];
    //    } 

        // move data from last component in dense array to the deleted component's position
        ${c.name}.SET.remove(${c.name}.CURSOR);
}
`
}

function createComponentAccessor(c: ComponentDescription, id: number) {


    let code = `
${c.importStatement}

${COMPONENT_BOILERPLATE(c)}

${generateComponentConstructionSignature(c)}

export class ${c.name} {
    static STRIDE: number = ${c.stride};
    static IDENTIFIER: number = ${id};
    static DESCRIPTION: ComponentDescription = ${JSON.stringify(c)}
    static CURSOR: number = 0;
    static MEM_CURSOR: number = 0;
    static SET: SparseSet;
    static NEXT: number = 0;
    static ALLOCATOR: Allocator;

    declare _constructionFootprint: ${c.name}Signature;
    
${generateViewsCode()}

    static IS_INITIALIZED: boolean = false; 
    ${generateInitializator(c)}
    ${generateComponentConstructor(c)}

    static to(cId: number) {

        if (!${c.name}.SET.contains(cId)) {
            throw new Error("Entity does not have this component");
        }

        ${c.name}.MEM_CURSOR = ${c.name}.SET.getValue(cId);
        ${c.name}.CURSOR = cId;
        return ${c.name};
    } \n\n`

    c.properties.forEach((p) => {
        const transformer = typeTransformers[p.type];
        if (transformer) {
            code += transformer(c, p) + "\n\n";
        } else {
            throw new Error(`No transformer found for type ${p.type} in property ${p.name} of component ${c.name} `);
        }
    })




    return code + "}\n";
}

function getDivisor(p: PropertyDefinition) {
    if (p.type.split("[]")[0].endsWith("32")) {
        return 4;
    } else if (p.type.split("[]")[0].endsWith("16")) {
        return 2;
    } else if (p.type.split("[]")[0].endsWith("8") || p.type.startsWith("char")) {
        return 1
    }

    return 4;
}

function isArray(f: PropertyDefinition) {
    return f.type.endsWith("[]");
}

import { Glob } from "bun"
import { match } from "node:assert";

export async function compile() {
    let index = 0;

    let createdComponents = [];

    for (const dir of COMPONENT_DIRS) {
        const components = new Glob(dir).scan();
        for await (const comp of components) {
            const code = await readFileSync(comp, "utf-8");
            const component = parseComponent(code);
            const moduleName = path.basename(comp).replace(".component.ts", "");
            writeFileSync(`./generated/${moduleName}.ts`, createComponentAccessor(component, index));
            createdComponents.push({ name: component.name, moduleName: moduleName, path: `./generated/${moduleName}.ts`, });
            index++;
        }

        writeFileSync('./generated/index.ts', `
        ${SPARSE_SET_DEF}

${createdComponents.map(c => {
            return `import { ${c.name} } from "./${c.moduleName}";`
        }).join("\n")
            }

    export const generatedComponents = [
        ${createdComponents.map(c => {
                return c.name;
            }).join(",\n")
            }
    ];

    export {
        ${createdComponents.map(c => {
                return c.name;
            }).join(",\n")
            }
}

export type GeneratedComponent = ${createdComponents.map(c => {
                return c.name;
            }).join(" | ")
            };

`)

    }
    return;
}

compile()

/* 
c.properties.forEach((p) => {

        // code += `// ${p.type}`

if (isArray(p)) {
    if (!p.pointer) {
        code += `   static get ${p.name}() {
        return ${c.name}.v${p.type.split("[]")[0]}.subarray(${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}, ${p.offset / getDivisor(p) + p.byteLength / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)})
    } 

    static set ${p.name}(v: ${p.type}) {
            ${(() => {
                if (p.length && p.length < 8) {
                    let x = "";
                    for (let i = 0; i < p.length!; i++) {
                        x += `${c.name}.v${p.type.split("[]")[0]}[${p.offset / getDivisor(p) + i} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}] = v[${i}]\n`
                    }

                    return x;
                } else {
                    return `${c.name}.v${p.type.split("[]")[0]}.set(v, ${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)})\n`
                }
            })()}
        }

    static cpy_${p.name}(out: ${p.type}) {
         ${(() => {
                if (p.length && p.length < 8) {
                    let x = "";
                    for (let i = 0; i < p.length!; i++) {
                        x += ` out[${i}] = ${c.name}.v${p.type.split("[]")[0]}[${p.offset / getDivisor(p) + i} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}]\n`
                    }

                    return x;
                } else {
                    return `out.set(${c.name}.v${p.type.split("[]")[0]}.subarray(${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}, ${p.offset / getDivisor(p) + p.byteLength / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}))\n`
                }

            })()}
    }
    \n\n`
    }
} else {
    code += `   static get ${p.name}() {
        return ${c.name}.v${p.type}[${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}];
    }`

    code += ` 
    
    static set ${p.name}(v: ${p.type}) {
        ${c.name}.v${p.type}[${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}] = v;
    }`

}

if (p.type == 'Vec3') {
    code += `
            static get ${p.name}X () {
        return ${c.name}.vf32[${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}];
            }

            static get ${p.name}Y () {
        return ${c.name}.vf32[${p.offset / getDivisor(p) + 1} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}];
            }

            static get ${p.name}Z () {
        return ${c.name}.vf32[${p.offset / getDivisor(p) + 2} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}];
            }
        
            `
}
    }); */