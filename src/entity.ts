import { Engine } from "./engine";
// import { Component } from "./render/types/component";
import { Component } from "./ecs/component";

export class Entity {
  world: Engine;

  public components: Map<new (...args: any[]) => Component, number> = new Map();

  constructor(world: Engine) {
    this.world = world;
  }

  addComponent<C extends new (...args: any[]) => Component>(
    ComponentClass: C,
    ...args: ConstructorParameters<C>
  ): InstanceType<C> {
    const componentId = this.world.ecs.createComponent(ComponentClass);
    this.components.set(ComponentClass, componentId);
  }

  getComponent<T extends Component>(
    type: new (...args: any[]) => T,
  ): T | undefined {
    console.log(this.components);
    return this.world.ecs.getComponent(type, this.components.get(type));
  }

  hasComponent<T extends Component>(type: new (...args: any[]) => T): boolean {
    return this.components.has(type);
  }

  removeComponent<T extends Component>(type: new (...args: any[]) => T): void {
    this.components.delete(type);
    this.world.invalidateQueryCache(); // Invalidate cache when components change
  }
}
