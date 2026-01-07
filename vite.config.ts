import { defineConfig } from "vite";
import { swc } from "rollup-plugin-swc3";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import o_config from "./opulenece.config";

export default defineConfig({
  plugins: [
    svelte({
      include: "src/editor/**.svelte",
    }),
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
  ],
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
});
