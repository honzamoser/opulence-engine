import { writeFileSync } from "fs";
import * as path from "path";
import { cwd } from "process";
import { Glob } from "bun";


const componentDirectories = [
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

// Component definition:
// Types: 
//     Scalars: f32, i32, u32, i16, u16, u8, char
//     Arrays: f32[len], i32[len], u32[len], u16[len], u8[len], char[len]
//     Util: Vec2, Vec3, Mat3, Mat4

import { ClassDeclaration, Project, PropertyDeclaration, SyntaxKind, TypedNode, TypeNode } from "ts-morph"
import { Mat4, mat4, vec3, Vec3 } from "wgpu-matrix";

//     pointer def: 
//         &f32[], &char[], 

// ex:

// RigidbodyComponent:
// position: Vec3;
// rotation: Vec3;
// scale: Vec3;
// matrix: Mat4;
// name: &char[];

/* What do we actually need to know from the component?
a) We need the information on how to store it into memory, that is:
    1) the total stride of the component
    2) the size of each property in the element
b) How to access each property of the component
    1) the offset of each property
    2) know wether it is a pointer or not */

const OUT_PATH = "./"

const target_path = path.join(cwd(), OUT_PATH);

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

const componentCode = `import { Mat4, Vec3, mat4, vec3 } from "wgpu-matrix"

export default class RigidbodyComponent {
    position?: Vec3 = vec3.zero();
    rotation?: Vec3;
    scale?: Vec3 = vec3.zero();
    matrix?: Mat4 = mat4.identity();
    name?: PointerTo<Uint8Array<ArrayBuffer>>;
    test: number = 0;
}`

const typeMap: { [key: string]: PropertyDefinition } = {
    "number": {
        name: null,
        type: "f32",
        byteLength: 4,
        offset: null,
        jsType: "number",
        default: "0"
    },
    "Vec3": {
        name: null,
        type: "f32[]",
        byteLength: 12,
        length: 3,
        offset: null,
        jsType: "Vec3",
        default: "vec3.zero()"
    },
    "Mat4": {
        name: null,
        type: "f32[]",
        byteLength: 64,
        length: 16,
        offset: null,
        jsType: "Mat4",
        default: "mat4.identity()"
    },
    "PointerTo<Uint8Array>": {
        name: null,
        type: "&u8[]",
        byteLength: 8,
        offset: null,
        pointer: true,
        jsType: "PointerTo<Uint8Array>",
        default: "{ ptr: undefined, ptr_len: 0 }"
    },
    "PointerTo<Float32Array>": {
        name: null,
        type: "&f32[]",
        byteLength: 8,
        offset: null,
        pointer: true,
        jsType: "PointerTo<Float32Array>",
        default: "{ ptr: undefined, ptr_len: 0 }"
    },
    "string": {
        name: null,
        type: "&char[]",
        byteLength: 8,
        offset: null,
        pointer: true,
        jsType: "PointerTo<Uint8Array>",
        default: "{ ptr: undefined, ptr_len: 0 }"
    },
    "Float32Array": {
        name: null,
        type: "f32[]",
        byteLength: 0, // to be filled
        offset: null,
        jsType: "Float32Array",
        default: "new Float32Array(16)"
    },
}

function parseComponent(code: string) {
    const t_project = new Project({
        useInMemoryFileSystem: true,
    })
    t_project.createSourceFile("component.ts", code);

    const sourceFile = t_project.getSourceFileOrThrow("component.ts");

    const components = sourceFile.getClasses().map((c) => {
        return parseClass(c);
    });

    return components[0];
}

function parseClass(cls: ClassDeclaration): ComponentDescription {
    console.log(`Component: ${cls.getName()}`);

    let offset = 4;

    const properties = cls.getProperties().map((p) => {
        let propDef = parseProperty(p);
        console.log(p.getName());

        if (p.getName() === "_componentId") {
            throw new Error("_componentId is a reserved property name");
        }

        propDef.name = p.getName();
        propDef.offset = offset;

        if (getInitializer(p)) {
            propDef.default = getInitializer(p);
        }

        offset += propDef.byteLength;

        return propDef;
    });

    const entityIdProperty: PropertyDefinition = {
        name: "_componentId",
        type: "i32",
        byteLength: 4,
        offset: 0,
        jsType: "number",
        default: "0"
    }

    return {
        name: cls.getNameOrThrow(),
        stride: properties[properties.length - 1].offset + properties[properties.length - 1].byteLength + 4,
        importStatement: getImportStatement(cls),
        properties: [...properties, entityIdProperty],
    }
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
            importStatement += `import { ${imp.getNamedImports().map(x => x.getName()).join(", ")} } from "${pathFromOutput}";\n`;
        } else {
            importStatement += imp.getText();
        }
    })

    return importStatement;
}

function getInitializer(p: PropertyDeclaration) {
    return p.getInitializer()?.getText();
}

function parseProperty(p: PropertyDeclaration): PropertyDefinition {
    const name = p.getName();
    const typeNode = p.getTypeNodeOrThrow();
    const typeStructure = recuresiveTypeParse(typeNode);

    console.log(typeStructure)

    const matchType = typeStructure.length == 1 ? typeMap[typeStructure[0]] : typeMap[typeStructure[0] + "<" + typeStructure[1] + ">"];

    return structuredClone(matchType)
}

function recuresiveTypeParse(typeNode: TypeNode): string[] {
    const children = typeNode.getChildren();
    console.log(typeNode.getText(), children.length)

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
                if (!(children[i].isKind(SyntaxKind.LessThanToken) || children[i].isKind(SyntaxKind.GreaterThanToken))) {
                    res = [...res, children[i].getText()];
                }
            }
        }
        return res;
    }
}

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
    offset: number,
    default?: string
}

const COMPONENT_BOILERPLATE = (c: ComponentDescription) => `
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

`

const views = {
    "vf32": "Float32Array",
    "vi32": "Int32Array",
    "vu8": "Uint8Array",
}

function generateViewsCode() {
    return Object.keys(views).map(x => {
        return `\tstatic ${x}: ${views[x]};\n`
    }).join("")

    //TODO: ref views (pointers)
}

function generateInitializator(c: ComponentDescription) {
    return `static initialize(v: {${Object.keys(views).map(x => { return `${x}: ${views[x]}` })}}) {
${Object.keys(views).map(x => {
        return `\t\t${c.name}.${x} = v.${x}\n`
    }).join("")}

        ${c.name}.IS_INITIALIZED = true;
        ${c.name}.SET = new SparseSet();
    }`
}

function generateComponentConstructionSignature(c: ComponentDescription) {
    return `type ${c.name}Signature = {
${c.properties.map(p => {
        return `    ${p.name}: ${p.jsType};`
    }).join("\n")}}`
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
}

function generateComponentConstructor(c: ComponentDescription) {
    return `static new(v: Partial<${c.name}Signature>) {
        const elId = ${c.name}.NEXT;
    ${c.name}.NEXT += 1;
    const memId = ${c.name}.SET.add(elId);

        const constructionData: ${c.name}Signature = {
            ${c.properties.map(p => {
        return `${p.name}: v.${p.name} ? v.${p.name} : ${p.default},`;
    }).join("\n")
        }
    }
    const base = ${c.name}.MEM_CURSOR * ${c.stride};
    ${c.name}.vi32[base / 4] = memId;
    ${c.name}.MEM_CURSOR += 1;
    ${c.properties.map(x => {
            if (x.name === "_componentId") {
                return "";
            }

            let out = ""
            if (!x.pointer) {
                if (x.length && x.length > 8) {
                    out += `${c.name}.${getCorrectView(x.type)}.set(constructionData.${x.name}, base / ${getDivisor(x)} + ${x.offset / getDivisor(x)});`
                } else {
                    for (let i = 0; i < (x.length ? x.length : 1); i++) {
                        out += `${c.name}.${getCorrectView(x.type)}[base / ${getDivisor(x)} + ${x.offset / getDivisor(x)} + ${i}] = constructionData.${x.name}${x.length ? `[${i}]` : ""};`
                    }
                }
            } else {
                return `// throw new Error("Pointers are not yet implemented");`
            }
            return out;
        }).join("\n")}
    

    return elId;
    }
        
    static delete() {
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
    }\n\n`

    c.properties.forEach((p) => {

        // code += `// ${p.type}`

        if (isArray(p)) {
            if (!p.pointer) {
                code += `   static get ${p.name}() {
        return ${c.name}.v${p.type.split("[]")[0]}.subarray(${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}, ${p.offset / getDivisor(p) + p.byteLength / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)})
    } 

    static set ${p.name}(v: ${p.jsType}) {
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

    static cpy_${p.name}(out: ${p.jsType}) {
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
    
    static set ${p.name}(v: ${p.jsType}) {
        ${c.name}.v${p.type}[${p.offset / getDivisor(p)} + ${c.name}.MEM_CURSOR * ${c.stride / getDivisor(p)}] = v;
    }`

        }

        if (p.jsType == 'Vec3') {
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
    });


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

console.log();

let index = 0;

let createdComponents = [];

for (const dir of componentDirectories) {
    const components = new Glob(dir).scanSync();
    for (const comp of components) {
        const code = await Bun.file(comp).text();
        const component = parseComponent(code);
        const moduleName = path.basename(comp).replace(".component.ts", "");
        writeFileSync(`./generated/${moduleName}.ts`, createComponentAccessor(component, index));
        createdComponents.push({ name: component.name, moduleName: moduleName, path: `./ generated / ${moduleName}.ts`, });
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
