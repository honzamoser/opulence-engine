import * as path from "path";
import { cwd } from "process";

// Component definition:
// Types: 
//     Scalars: f32, i32, u32, i16, u16, u8, char
//     Arrays: f32[len], i32[len], u32[len], u16[len], u8[len], char[len]
//     Util: Vec2, Vec3, Mat3, Mat4

import { ClassDeclaration, Project, PropertyDeclaration, SyntaxKind, TypedNode, TypeNode } from "ts-morph"

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

type PointerTo<T> = {
    ptr: number,
    ptr_len: number
}

type ComponentDescription = {
    name: string,
    stride: number,
    importStatement: string,
    properties: PropertyDefinition[],
}

const componentCode = `import { Mat4, Vec3 } from "wgpu-matrix"

type PointerTo<T> = {
    ptr: number,
    ptr_len: number
}

export default class RigidbodyComponent {
    position?: Vec3 = vec3.zero();
    rotation?: Vec3 = vec3.zero();
    scale?: Vec3 = vec3.zero();
    matrix?: Mat4 = mat4.zero();
    name?: PointerTo<Uint8Array<ArrayBuffer>> = pointer.create(64);
}`

const typeMap: { [key: string]: PropertyDefinition } = {
    "number": {
        name: null,
        type: "f32",
        byteLength: 4,
        offset: null,
    },
    "Vec3": {
        name: null,
        type: "f32[]",
        byteLength: 12,
        length: 3,
        offset: null
    },
    "Mat4": {
        name: null,
        type: "f32[]",
        byteLength: 64,
        length: 16,
        offset: null
    },
    "PointerTo<Uint8Array>": {
        name: null,
        type: "&u8[]",
        byteLength: 8,
        offset: null,
        pointer: true
    },
    "PointerTo<Float32Array>": {
        name: null,
        type: "&f32[]",
        byteLength: 8,
        offset: null,
        pointer: true
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

    console.log(components[0])
}

function parseClass(cls: ClassDeclaration): ComponentDescription {
    console.log(`Component: ${cls.getName()}`);

    let offset = 0;

    const properties = cls.getProperties().map((p) => {
        let propDef = parseProperty(p);
        console.log(p.getName());
        propDef.name = p.getName();
        propDef.offset = offset;

        if (getInitializer(p)) {
            propDef.default = getInitializer(p);
        }

        offset += propDef.byteLength;

        return propDef;
    });

    return {
        name: cls.getNameOrThrow(),
        stride: properties[properties.length - 1].offset + properties[properties.length - 1].byteLength,
        importStatement: getImportStatement(cls),
        properties
    }
}

function getImportStatement(cls: ClassDeclaration): string {
    const sourceFile = cls.getSourceFile();
    const filePath = sourceFile.getFilePath();

    const imports = sourceFile.getImportDeclarations();

    let importStatement = "";

    imports.forEach((imp) => {
        
        const importPath  = imp.getModuleSpecifier().getText();
        if(importPath.startsWith(".") || importPath.startsWith("/")) {
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

    const matchType = typeStructure.length == 1 ? typeMap[typeStructure[0]] : typeMap[typeStructure[0] + "<" + typeStructure[1] + ">"];

    return structuredClone(matchType)
}

function recuresiveTypeParse(typeNode: TypeNode): string[] {
    const children = typeNode.getChildren();
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
    byteLength: number,

    arrayLength?: number,
    pointer?: boolean,
    length?: number,
    offset: number | null,
    default?: string
}

parseComponent(componentCode);