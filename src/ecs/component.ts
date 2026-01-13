import { ComponentEntry } from "./ecs";

export abstract class Component {
  static id: number = undefined;
  static bufferMap: ComponentEntry = undefined;
  static componentAccessInstance: Component = new (this as any)();
}
