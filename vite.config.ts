import { defineConfig } from "vite";
import { swc } from "rollup-plugin-swc3";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import o_config from "./opulenece.config";
import * as ts from "typescript";
import { removeConsoleLogTransformer } from "./plugin/remove-console";

const myCustomTransformerPlugin = () => {
  return {
    name: 'typescript-custom-transformer',
    // We want this to run before Vite's default esbuild transform
    enforce: 'pre', 
    
    transform(code: string, id: string) {
      // Only process .ts or .tsx files
      if (!id.endsWith('.component.ts')) return;
      console.log("Transforming:", id);

      // Use TypeScript to transform the code
      const result = ts.transpileModule(code, {
        compilerOptions: {
          // Ensure we output modern JS that Vite/Esbuild can pick up next
          target: ts.ScriptTarget.ESNext, 
          module: ts.ModuleKind.ESNext,
        },
        transformers: {
          // Inject your custom transformer here
          before: [removeConsoleLogTransformer], 
        },
      });

      // Return the transformed code to Vite
      return {
        code: result.outputText,
        map: result.sourceMapText,
      };
    },
  };
};

export default defineConfig({
  plugins: [
    // svelte({
    //   include: "src/editor/**.svelte",
    //   onwarn: null,
      
    // }), 
    // myCustomTransformerPlugin()
  ],
  
    // swc({
    //   sourceMaps: true,
    //   jsc: {
    //     parser: {
    //       syntax: "typescript",
    //       decorators: true,
    //       dynamicImport: true,
    //     },
    //     transform: {
    //       // legacyDecorator: true,
    //       decoratorMetadata: true,
    //     },
    //     target: "esnext",
    //     keepClassNames: true,
    //   },
    // }),
  
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
    },
  },
  define: {
    opulence_config: o_config,
  },
  assetsInclude: ["**/*.wgsl", "**/*.glb", "**/*.gltf", "**/*.png", "**/*.jpg"],
  publicDir: "resources",
  esbuild: {
    target: "es2022",
  }
});
