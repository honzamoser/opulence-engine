import { deepkitType } from "@deepkit/vite";
import { defineConfig } from "vite";
import { readdirSync } from "fs";
import config from "./opulenece.config";
import swc from "vite-plugin-swc-transform";

export default defineConfig({
  plugins: [
    swc({
      swcOptions: {
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
      },
    }),
  ],
  esbuild: false,
  optimizeDeps: {
    esbuildOptions: {
      tsconfig: "./tsconfig.json",
    },
  },
  define: {
    __COMPONENTS__: readdirSync("./" + config.componentLocation).map((file) => {
      return {
        name: file.replace(".ts", ""),
        path: config.componentLocation + file.replace(".ts", ""),
      };
    }),
  },
});
