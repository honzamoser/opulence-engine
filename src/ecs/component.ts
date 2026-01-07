import { ComponentEntry } from "../opulence-ecs/ecs";

export abstract class Component {
  static id: number = undefined;
  static bufferMap: ComponentEntry = undefined;
}
