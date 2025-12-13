import {
  vec2,
  Mat4,
  Quat,
  Vec2,
  Vec2Type,
  Vec3,
  vec3,
  mat4,
} from "wgpu-matrix";
import { Engine } from "./engine";
// import { Component } from "./render/types/component";
import { Mesh } from "./renderer/mesh";
import { Component } from "./ecs/component";
import { System } from "./ecs/system";

export class Entity {
  world: Engine;

  public components: Map<new (...args: any[]) => Component, Component> =
    new Map();

  constructor(world: Engine) {
    this.world = world;
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
