import { Project, SyntaxKind, Scope, VariableDeclarationKind, SourceFile } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

// Configuration
const COMPONENT_GLOB_PATTERNS = [
  "src/ecs/components/**/*.component.ts",
  "game_src/components/**/*.ts",
];
const OUTPUT_DIR = "generated-components";
const PROJECT_ROOT = process.cwd();

// Initialize ts-morph project
const project = new Project({
  tsConfigFilePath: path.join(PROJECT_ROOT, "tsconfig.json"),
  skipAddingFilesFromTsConfig: true,
});

// Add source files
const sourceFiles = project.addSourceFilesAtPaths(COMPONENT_GLOB_PATTERNS);

console.log(`Found ${sourceFiles.length} component files to process\n`);

// // Process each component file
// sourceFiles.forEach((sourceFile) => {
//   console.log(`Processing: ${sourceFile.getFilePath()}`);

//   // Get all classes that extend Component
//   const classes = sourceFile.getClasses();

//   classes.forEach((classDecl) => {
//     const baseClass = classDecl.getBaseClass();
//     if (!baseClass || !baseClass.getName()?.includes("Component")) {
//       console.log(`  Skipping ${classDecl.getName()} - not a Component`);
//       return;
//     }

//     const className = classDecl.getName();
//     console.log(`  Processing class: ${className}`);

//     // Check if ECS property exists, if not add it
//     let ecsProperty = classDecl.getProperty("ECS");
//     if (!ecsProperty) {
//       classDecl.insertProperty(0, {
//         name: "ECS",
//         type: "ECS",
//         scope: Scope.Protected,
//       });
//       console.log(`    Added ECS property`);
//     }

//     classDecl.insertProperty(0, {
//       name: "index",
//       type: "number",
//       scope: Scope.Protected,
//     });

//     // Remove existing duplicate constructors first
//     const existingConstructors = classDecl.getConstructors();
//     if (existingConstructors.length > 1) {
//       // Remove all but the first
//       for (let i = 1; i < existingConstructors.length; i++) {
//         existingConstructors[i].remove();
//       }
//       console.log(
//         `    Removed ${existingConstructors.length - 1} duplicate constructor(s)`,
//       );
//     }

//     // Get or create constructor
//     let constructor = classDecl.getConstructors()[0];
//     if (!constructor) {
//       constructor = classDecl.addConstructor({
//         statements: [],
//         parameters: [
//           {
//             name: "idat",
//             type: "number",
//           },
//         ],
//       });
//       console.log(`    Added constructor`);
//     }

//     // Check if ECS assignment already exists
//     const constructorStatements = constructor.getStatements();
//     const hasEcsAssignment = constructorStatements.some((stmt) => {
//       const text = stmt.getText();
//       return text.includes("this.ECS") && text.includes("ECS.instance");
//     });

//     const hasSuperCall = constructorStatements.some((stmt) => {
//       const text = stmt.getText();
//       return text.includes("super()");
//     });

//     if (!hasEcsAssignment) {
//       constructor.insertStatements(
//         0,
//         "this.ECS = ECS.instance; this.index = idat;",
//       );
//       console.log(`    Added ECS.instance assignment to constructor`);
//     }

//     if (!hasSuperCall) {
//       constructor.insertStatements(0, "super();");
//       console.log(`    Added super() call to constructor`);
//     }

//     // Get all instance properties (exclude static)
//     const properties = classDecl.getInstanceProperties();

//     let accessorsAdded = 0;

//     properties.forEach((prop) => {
//       if (prop.getKind() !== SyntaxKind.PropertyDeclaration) {
//         return;
//       }

//       const propDecl = prop.asKind(SyntaxKind.PropertyDeclaration);
//       if (!propDecl) return;

//       const propName = propDecl.getName();

//       // Skip if it's the ECS property we just added
//       if (propName === "ECS") return;

//       // Check if getter/setter already exist
//       const getterName = `get ${propName}`;
//       const setterName = `set ${propName}`;
//       const existingGetter = classDecl.getGetAccessor(propName);
//       const existingSetter = classDecl.getSetAccessor(propName);

//       if (existingGetter && existingSetter) {
//         return; // Already have both
//       }

//       const propType = propDecl.getType();
//       const propTypeText =
//         propDecl.getTypeNode()?.getText() || propType.getText();

//       // Make the property private and add underscore prefix
//       const privatePropName = `_${propName}`;

//       // Rename the property
//       if (!classDecl.getProperty(privatePropName)) {
//         propDecl.rename(privatePropName);
//         propDecl.setScope(Scope.Private);
//       }

//       // Add getter if it doesn't exist
//       if (!existingGetter) {
//         classDecl.addGetAccessor({
//           name: propName,
//           returnType: propTypeText,
//           statements: `return this.ECS.getComponentValue(this.index, this, "${propName}");`,
//         });
//         accessorsAdded++;
//       }

//       // Add setter if it doesn't exist
//       if (!existingSetter) {
//         classDecl.addSetAccessor({
//           name: propName,
//           parameters: [{ name: "value", type: propTypeText }],
//           statements: `this.ECS.setComponentValue(this.index, this, "${propName}", value)`,
//         });
//         accessorsAdded++;
//       }
//     });

//     console.log(`    Added ${accessorsAdded / 2} getter/setter pairs`);
//   });

//   // Ensure ECS import exists
//   const existingImports = sourceFile.getImportDeclarations();
//   const hasEcsImport = existingImports.some((imp) => {
//     const namedImports = imp.getNamedImports();
//     return namedImports.some((ni) => ni.getName() === "ECS");
//   });

//   if (!hasEcsImport) {
//     // Determine the relative path to the ECS module
//     const sourceDir = path.dirname(sourceFile.getFilePath());
//     const ecsPath = path.join(PROJECT_ROOT, "src/opulence-ecs/ecs.ts");
//     let relativePath = path.relative(sourceDir, ecsPath);

//     // Convert to forward slashes and remove .ts extension
//     relativePath = relativePath.replace(/\\/g, "/").replace(/\.ts$/, "");

//     // Ensure it starts with ./ or ../
//     if (!relativePath.startsWith(".")) {
//       relativePath = "./" + relativePath;
//     }

//     sourceFile.addImportDeclaration({
//       moduleSpecifier: relativePath,
//       namedImports: ["ECS"],
//     });
//     console.log(`    Added ECS import`);
//   }

//   console.log("");
// });

// // Save modified files to output directory
// const outputPath = path.join(PROJECT_ROOT, OUTPUT_DIR);

// // Create output directory if it doesn't exist
// if (!fs.existsSync(outputPath)) {
//   fs.mkdirSync(outputPath, { recursive: true });
// }

// console.log(`\nSaving modified files to: ${outputPath}\n`);

// sourceFiles.forEach((sourceFile) => {
//   const originalPath = sourceFile.getFilePath();
//   const relativePath = path.relative(PROJECT_ROOT, originalPath);
//   const outputFilePath = path.join(outputPath, relativePath);

//   // Create subdirectories if needed
//   const outputFileDir = path.dirname(outputFilePath);
//   if (!fs.existsSync(outputFileDir)) {
//     fs.mkdirSync(outputFileDir, { recursive: true });
//   }

//   // Write the modified file
//   fs.writeFileSync(outputFilePath, sourceFile.getFullText());
//   console.log(`  Saved: ${relativePath}`);
// });

// console.log("\n✅ Code generation complete!");
// console.log(
//   `\nModified files have been saved to the '${OUTPUT_DIR}' directory.`,
// );


project.emit({
  customTransformers: {
    // optional transformers to evaluate before built in .js transformations
    before: [context => sourceFile => visitSourceFile(sourceFile, context, numericLiteralToStringLiteral)],
    // optional transformers to evaluate after built in .js transformations
    after: [],
    // optional transformers to evaluate after built in .d.ts transformations
    afterDeclarations: [],
  },
});

function visitSourceFile(
  sourceFile: SourceFile,
  context: any,
  visitNode: (node: Node, context: any) => Node,
) {
  return visitNodeAndChildren(sourceFile) as SourceFile;

  function visitNodeAndChildren(node: Node): Node {
    return visitEachChild(visitNode(node, context), visitNodeAndChildren, context);
  }
}

function numericLiteralToStringLiteral(node: ts.Node, context: ts.TransformationContext) {
  if (ts.isNumericLiteral(node))
    return context.factory.createStringLiteral(node.text);
  return node;
}