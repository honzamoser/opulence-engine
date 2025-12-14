import { Engine } from "./engine";
// import { Component } from "./render/types/component";
import { Component } from "./ecs/component";

export class Entity {
  world: Engine;

  public components: Map<new (...args: any[]) => Component, Component> =
    new Map();

  constructor(world: Engine) {
    this.world = world;
    import("./opulence-ecs/ecs.ts");
  }

  addComponent<C extends new (...args: any[]) => Component>(
    ComponentClass: C,
    ...args: ConstructorParameters<C>
  ): InstanceType<C> {
    const component = new ComponentClass(...args);
    this.components.set(ComponentClass, component);
    this.world.invalidateQueryCache(); // Invalidate cache when components change
    return component as InstanceType<C>;
  }

  getComponent<T extends Component>(
    type: new (...args: any[]) => T,
  ): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  hasComponent<T extends Component>(type: new (...args: any[]) => T): boolean {
    return this.components.has(type);
  }

  removeComponent<T extends Component>(type: new (...args: any[]) => T): void {
    this.components.delete(type);
    this.world.invalidateQueryCache(); // Invalidate cache when components change
  }
}
