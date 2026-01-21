// vite-plugin-ecs.ts
import { Plugin, transformWithEsbuild } from "vite";
import { generateAccessorsCode } from "./accessor-generation/generator";
import fs from "fs";
import { reflectComponents } from "./accessor-generation/reflection";

export default function ecsVirtualPlugin(): Plugin {
  const virtualModuleId = "virtual:ecs";
  const resolvedVirtualModuleId = "\0virtual:ecs.ts"
  const dtsPath = "generated/ecs.d.ts" // <--- The physical file

  // Helper to run codegen and save types
  const update = () => {
    try {
      const { outputCode, types } = generateAccessorsCode();
      


      // Write the .d.ts to disk so VS Code wakes up
      // Only write if changed to avoid infinite loops/flickering
      fs.writeFileSync("./debug_virtual.ts", outputCode);
      if (!fs.existsSync(dtsPath) || fs.readFileSync(dtsPath, 'utf-8') !== types) {
        fs.writeFileSync(dtsPath, types);
        console.log("[ECS] Types updated on disk.");

      }

      return outputCode;
    } catch (e) {
      console.error(e);
      return "export {}"; // Fallback to avoid crash
    }
  };

  return {
    name: "opulence-compiler",

    // 1. Tell Vite we handle this import
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    // 2. Serve the implementation from RAM
    async load(id) {
      if (id === resolvedVirtualModuleId) {
        const tsCode = update(); // Returns the 'code' string

        const result = await transformWithEsbuild(tsCode, 'virtual.ts', {
          loader: 'ts',
          sourcemap: true
        })

        return result;
      }
    },

    // 3. Watch for changes
    handleHotUpdate({ file, server }) {
      if (file.endsWith(".component.ts")) {
        // Force Vite to reload the virtual module
        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }

        // Re-run codegen (writes .d.ts to disk)
        update();

        // Notify browser
        server.ws.send({ type: "full-reload" });
      }
    },

    // 4. Run on startup to ensure d.ts exists
    buildStart() {
      update();
    }
  };
}