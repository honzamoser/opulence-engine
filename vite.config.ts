import { defineConfig } from "vite";
import o_config from "./opulenece.config";
import ecsCodegen from "./plugin/opulence-compiler"

export default defineConfig({
  plugins: [
    // svelte({
    //   include: "src/editor/**.svelte",
    //   onwarn: null,

    // }), 
    // myCustomTransformerPlugin()
    ecsCodegen(),
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
