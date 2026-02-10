import { defineConfig } from "vite";
import o_config from "./opulenece.config";
import ecsCodegen from "./plugin/opulence-compiler"
import path from "path/win32";
import { fileURLToPath } from "url";
import wasm from "vite-plugin-wasm";
import { format } from "path";

export default defineConfig({
  plugins: [
    // svelte({
    //   include: "src/editor/**.svelte",
    //   onwarn: null,

    // }), 
    // myCustomTransformerPlugin()
    // ecsCodegen(),
    wasm(),
  ],
  worker: {
    plugins: () => [wasm()],
    format: "es",
  }

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
  },
  resolve: {
    alias: [
      {find: "@generated", replacement: fileURLToPath(new URL("./generated/index.ts", import.meta.url))} 
      // "@generated/*": path.resolve(__dirname, "./generated/*"),
    ]
  }
});
