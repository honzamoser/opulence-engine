import path from "path";
import { Project, ClassDeclaration, ScriptTarget, ModuleKind } from "ts-morph";
import { reflectComponents } from "./reflection";
import { cwd } from "process";

// ============================================================================
// Type Definitions
// ============================================================================

interface TypeConfig {
    bytes: number;
    view: 'f32' | 'i32' | 'u8';
}

interface FieldSchema {
    name: string;
    view: string;
    offset: number;
    count: number;
    typeName: string;
    storageType: "hot" | "cold";
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
        return 8;
    }

    // return 1;
}

// ============================================================================
// Code Generation Functions
// ============================================================================

function generateFileHeader(): string {
    return `// GENERATED AT ${new Date().toISOString()}
// AUTO-GENERATED - DO NOT EDIT

export interface MemoryViews {
    f32: Float32Array;
    u32: Uint32Array;
    i32: Int32Array;
    u8: Uint8Array;
}
`;
}

function generateTypeDefinitionsHeader(): string {
    return `// GENERATED AT ${new Date().toISOString()}
// AUTO-GENERATED - DO NOT EDIT

declare module "virtual:ecs-accessors" {
    export interface MemoryViews {
        f32: Float32Array;
        u32: Uint32Array;
        i32: Int32Array;
        u8: Uint8Array;
    }
`;
}

function generateClassHeader(className: string, stride: number, path: string): string {
    return `
export class ${className}Accessor {
    public index: number = ${(indexCursor).toString()};
    public static readonly stride: number = ${stride};
    public static readonly parent:typeof  ${className} = ${className}
    
    private f32: Float32Array;
    private i32: Int32Array;
    private u8: Uint8Array;

    private cf32: Float32Array;
    private ci32: Int32Array;
    private cu8: Uint8Array;

    constructor(views: MemoryViews, coldViews: MemoryViews) {
        this.f32 = views.f32;
        this.i32 = views.i32;
        this.u8 = views.u8;

        this.cf32 = coldViews.f32;
        this.ci32 = coldViews.i32;
        this.cu8 = coldViews.u8;
    }

    to(index: number) {
        this.index = index;
        return this;
    }
`;
}


function generateArrayAccessors(field: FieldSchema, stride: number): { code: string; types: string } {
    const capitalizedName = capitalize(field.name);
    const bytesPerEl = field.view === 'u8' ? 1 : 4;
    const indexCalc = `(this.index * ${stride} + ${field.offset}) / ${bytesPerEl}`;

    const assignments = Array.from({ length: field.count })
        .map((_, i) => `out[${i}] = this.${field.view}[base + ${i}];`)
        .join('\n        ');

    const setters = Array.from({ length: field.count })
        .map((_, i) => `this.${field.view}[base + ${i}] = v[${i}];`)
        .join('\n        ');

    const code = `
    get${capitalizedName}(out: Float32Array | number[]): void {
        const base = ${indexCalc};
        ${assignments}
    }

    set${capitalizedName}(v: Float32Array | number[]): void {
        const base = ${indexCalc};
        ${setters}
    }
`;

    const types = `
        get${capitalizedName}(out: Float32Array | number[]): void;
        set${capitalizedName}(v: Float32Array | number[]): void;
`;

    return { code, types };
}

function generatePrimitiveAccessors(field: FieldSchema, stride: number): { code: string; types: string } {
    const bytesPerEl = field.view === 'u8' ? 1 : 4;
    const indexCalc = `(this.index * ${stride} + ${field.offset}) / ${bytesPerEl}`;

    const code = `
    get ${field.name}() {
        return this.${field.view}[${indexCalc}];
    }
    
    set ${field.name}(v: number) {
        this.${field.view}[${indexCalc}] = v;
    }
`;

    const types = `
        get ${field.name}(): number;
        set ${field.name}(v: number);
`;

    return { code, types };
}

function generatePointerAccessors(field: FieldSchema, stride: number): { code: string; types: string } {
    const capitalizedName = capitalize(field.name);
    const bytesPerEl = field.view === 'u8' ? 1 : 4;
    const indexCalc = `(this.index * ${stride} + ${field.offset}) / ${bytesPerEl}`;



    const code = `
    get${capitalizedName}(out: Float32Array | number[]): void {
        const base = ${indexCalc};
        const ptr = this.i32[base]; // pointer address
        const ptr_len = this.i32[base + 1]; // pointer length in bytes
        
        for (let i = 0; i < ptr_len; i++) {
            out[i] = this.f32[ptr / 4 + i];
        }
    }

    set${capitalizedName}(v: Float32Array | number[]): void {
        const base = ${indexCalc};
        const ptr = this.i32[base];
        const ptr_len = this.i32[base + 1];

        if(v.byteLength > ptr_len) {
            throw new Error("Pointer overflow: trying to write more data than allocated.");
        }

        for (let i = 0; i < v.length; i++) {
            this.f32[ptr / 4 + i] = v[i];
        }
    }
`;

    const types = `
        get${capitalizedName}(out: Float32Array | number[]): void;
        set${capitalizedName}(v: Float32Array | number[]): void;
`;

    return { code, types };
}
// ============================================================================
// Component Parsing
// ============================================================================

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
            const byteSize = config.bytes * count;

            schema.push({
                name: prop.getName(),
                view: config.view,
                offset: offset,
                count: count,
                typeName: typeName,
                storageType: "hot"
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
                view: config.view,
                offset: offset,
                count: count,
                typeName: typeName,
                storageType: "cold"
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

export function generateAccessorsCode() {
    const project = new Project();
    const sourceFiles = project.addSourceFilesAtPaths("src/ecs/components/**.component.ts");

    const generatedClasses: string[] = [];
    let outputCode = generateFileHeader();

    let importStatements: {
        name: string;
        path: string;
    }[] = [];

    let classImportsGLobal: Map<string, {path: string, imports: string[]} > = new Map();

    sourceFiles.forEach(sourceFile => {
        sourceFile.getClasses().forEach(classDeclaration => {
            const classImports = sourceFile.getImportDeclarations();
            classImports.forEach(imp => {
                const namedImports = imp.getNamedImports();
                namedImports.forEach(nImp => {
                    const name = nImp.getName();
                    const path = imp.getModuleSpecifierValue();

                    if (classImportsGLobal.has(path)) {
                        const existing = classImportsGLobal.get(path)!;
                        if (!existing.includes(name)) {
                            existing.push(name);
                            classImportsGLobal.set(path, existing);
                        }
                    } else {
                        classImportsGLobal.set(path, [name]);
                    }
                });
            });



            const { className, schema, stride } = parseComponent(classDeclaration);

            if (schema.length === 0) return;
            if (!className) return;

            importStatements.push({ name: className, path: sourceFile.getFilePath() });
            generatedClasses.push(className + "Accessor");

            outputCode += generateClassHeader(className, stride, sourceFile.getFilePath());

            schema.forEach(field => {
                const { code, types } = field.storageType === "hot" ? ['float32Array', 'string'].includes(field.typeName)
                    ? generateArrayAccessors(field, stride)
                    : generatePrimitiveAccessors(field, stride) : generatePointerAccessors(field, stride);

                outputCode += code;

            });

            outputCode += `}\n`;


            indexCursor++;
        });
    });

    outputCode += `\nexport const generatedComponents = [${generatedClasses.join(", ")}];\n`;




    const refCode = reflectComponents();

    outputCode += '\n' + refCode;

    const typeproject = new Project({
        compilerOptions: {
            declaration: true,
            emitDeclarationOnly: true,
            // Ensure these match your environment so types (like Float32Array) are known
            target: ScriptTarget.ESNext,
            module: ModuleKind.ESNext,
        },
        skipAddingFilesFromTsConfig: true, // Don't load your whole project (speed)
    });

    outputCode = importStatements.map(i => `import ${i.name} from "${i.path}";\n`).join('') + '\n' + Array.from(classImportsGLobal.entries()).map(([_path, names]) => `import { ${names.join(', ')} } from "${(() => {
        if (_path.startsWith(cwd())) {
            return _path.replace(/\\/g, "/");
        }
        return _path;
    })()}";`).join('\n') + '\n' + outputCode;

    const sourceFile = typeproject.createSourceFile("virtual-temp.ts", outputCode, { overwrite: true });
    const emitOutput = sourceFile.getEmitOutput();
    const rawDts = emitOutput.getOutputFiles().find(f => f.getFilePath().endsWith('.d.ts'))?.getText();

    if (!rawDts) throw new Error("Failed to generate d.ts");

    // 3. THE FIX: Separate Imports from Body
    // We need to hoist imports OUTSIDE the "declare module" block

    const lines = rawDts.split('\n');
    const imports: string[] = [];
    const body: string[] = [];

    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('importtype ')) {
            imports.push(line);
        } else {
            // We also need to remove 'export declare' and just make it 'export'
            // inside the module block, although TS is usually lenient here.
            // But purely, 'rawDts' usually has 'export declare class'.
            // Inside 'declare module', we just want 'export class'.
            body.push(line.replace(/export declare/g, 'export'));
        }
    });



    // 4. Reconstruct the file correctly
    let wrappedDts = `declare module "virtual:ecs" {
    
${body.join('\n')}
}
`;

    wrappedDts = importStatements.map(i => `type ${i.name} = import("${i.path}").default;`).join('\n') + '\n\n' + wrappedDts;
    return {
        outputCode, types: wrappedDts

    };
}