import { deepkitType } from "@deepkit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    deepkitType({
      tsConfig: "./tsconfig.json",
    }),
  ],
});
