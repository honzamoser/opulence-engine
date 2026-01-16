import path from "path";
import { Project, ClassDeclaration, ScriptTarget, ModuleKind } from "ts-morph";

// ============================================================================
// Type Definitions
// ============================================================================

interface TypeConfig {
    bytes: number;
    view: 'f32' | 'i32' | 'u8';
}


interface ComponentSchema {
    className: string | undefined;
    schema: FieldSchema[];
    stride: number;
}

// ============================================================================
// Configuration
// ============================================================================

const TYPE_CONFIG: Record<string, TypeConfig> = {
    'int32': { bytes: 4, view: 'i32' },
    'float32': { bytes: 4, view: 'f32' },
    'boolean': { bytes: 1, view: 'u8' },
    'float32Array': { bytes: 4, view: 'f32' },
};

// ============================================================================
// Utility Functions
// ============================================================================

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTypeName(decorator: any): string | undefined {
    const decoratorCall = decorator.getCallExpression();
    const accessExpr = decoratorCall
        ? decoratorCall.getExpression()
        : decorator.getExpression();

    return accessExpr.getLastChild()?.getText();
}

function getArrayCount(decorator: any, typeName: string, propName: string): number {
    const args = decorator.getArguments();

    if (args.length > 0) {
        return parseInt(args[0].getText());
    }

    if (typeName === 'float32Array') {
        //is a pointer type, default to 8
        return 2;
    }

    return 1;
}

let indexCursor = 0;

function parseComponent(classDec: ClassDeclaration): ComponentSchema {
    let offset = 0;
    const schema: FieldSchema[] = [];

    for (const prop of classDec.getProperties()) {
        const hotDecorator = prop.getDecorators().find(d =>
            d.getName() === "hot" || d.getText().startsWith("@hot")
        );

        if (hotDecorator) {
            const typeName = getTypeName(hotDecorator);
            if (!typeName || !TYPE_CONFIG[typeName]) continue;

            const count = getArrayCount(hotDecorator, typeName, prop.getName());
            const config = TYPE_CONFIG[typeName];
            // console.log(count, config)
            const byteSize = config.bytes * count;
            const defaultValue = prop.getInitializer()?.getText();

            schema.push({
                name: prop.getName(),
                count: count,
                offset: offset,
                pointer: false,
                type: typeName,
                defaultValue: defaultValue
            });

            offset += byteSize;
            continue;
        }

        const coldDecorator = prop.getDecorators().find(d =>
            d.getName() === "cold" || d.getText().startsWith("@cold")
        );

        if (coldDecorator) {
            const typeName = getTypeName(coldDecorator);
            if (!typeName || !TYPE_CONFIG[typeName]) continue;

            const count = getArrayCount(coldDecorator, typeName, prop.getName());
            const config = TYPE_CONFIG[typeName];

            schema.push({
                name: prop.getName(),
                count: count,
                offset: offset,
                pointer: true,
                type: typeName,
                defaultValue: undefined
            });

            offset += 8;
        }
    }

    return {
        className: classDec.getName(),
        schema,
        stride: offset
    };
}

// ============================================================================
// Main Generator
// ============================================================================

type ComponentStructure = {
    name: string,
    path: string,
    id: number,
    stride: number,
    fields: FieldSchema[]
}

type FieldSchema = {
    name: string;
    type: string;
    offset: number;
    count: number;
    defaultValue?: any;
    pointer: boolean;
}

export function reflectComponents() {
    const project = new Project();
    const sourceFiles = project.addSourceFilesAtPaths(["src/ecs/components/**.component.ts", "game_src/components/**.component.ts"]);

    let index = 0;
    const registry: ComponentStructure[] = []

    sourceFiles.forEach(sf => {
        sf.getClasses().forEach(cd => {
            const comp = parseComponent(cd);
            let entry: ComponentStructure = {
                name: cd.getName() || "UnnamedComponent",
                path: "/" + path.relative(process.cwd(), sf.getFilePath()).replace(/\\/g, "/"),
                id: index++,
                stride: comp.stride,
                fields: comp.schema,
                cls: cd
            };
            registry.push(entry);

        });

    });


    const outputCode = `export const components = [` + registry.map(x => {
        return `{
    name: "${x.name}",
    path: "${x.path}",
    id: ${x.id},
    stride: ${x.stride},
    cls: ${x.name},
    fields: [${x.fields.map(f => `{
        name: "${f.name}",
        count: ${f.count},
        offset: ${f.offset},
        pointer: ${f.pointer},
        type: "${f.type}",
        ${f.defaultValue !== undefined ? `defaultValue: ${f.defaultValue},` : ''}
    }`).join(", ")}]}` ;
    }) + `]`;
    return outputCode;
}
