import { deepkitType } from "@deepkit/vite";
import "reflect-metadata";
import { dynamic, infrequent } from "./component-gen";
import Module from "module";

declare const __COMPONENTS__: { path: string; name: string }[];

export class ECS {
  componentRegistry = new Map<string, { bufferMap: any; stride: number }>();

  async loadComponents() {
    const components = import.meta.glob("../../game_src/components/*.ts");
    console.log(components);
    for (const componentImport in components) {
      const module = (await components[componentImport]()) as any;
      this.createBufferMap(module.default);
    }

    console.log(this.componentRegistry);
  }

  createBufferMap(module: Function) {
    const properties = Reflect.getMetadata("ecs:registry", module);

    let stride = 0;
    const bufferMap = [];

    for (const property of properties) {
      const rate =
        Reflect.getMetadata("ecs:rate", module.prototype, property.name) ||
        "infrequent";

      const max =
        Reflect.getMetadata("ecs:max", module.prototype, property.name) || 0;

      const type =
        Reflect.getMetadata("ecs:type", module.prototype, property.name) ||
        "fixed";

      const access =
        Reflect.getMetadata("ecs:access", module.prototype, property.name) ||
        "writable";

      stride +=
        rate === "frequent"
          ? 4
          : max > 0
            ? max
            : this.getTypeSize(property.type);
      bufferMap.push({
        name: property.name,
        type: property.type,
        rate,
        access,
        offset: stride,
        size: max > 0 ? max : this.getTypeSize(property.type),
        pointer: type === "frequent",
      });
    }

    this.componentRegistry.set(module.name, { bufferMap, stride });
  }
  getTypeSize(type: any) {
    return 4;
  }
}

new ECS().loadComponents();
