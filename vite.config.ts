import { defineConfig } from "vite";
import { swc } from "rollup-plugin-swc3";

export default defineConfig({
  plugins: [
    swc({
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          // legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: "esnext",
        keepClassNames: true,
      },
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
    },
  },
});
