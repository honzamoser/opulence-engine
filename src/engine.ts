import { startLifecycle } from "./lifecycle";
import { vec2, vec3, Vec3 } from "wgpu-matrix";
import { Renderer } from "./renderer/renderer";
import { System } from "./ecs/system";
import { Component } from "./ecs/component";
import { PointerManager } from "./data/arrayBufferPointer";
import { ClassConstructor, ECS } from "./ecs/ecs";
import { Helios2Renderer } from "./renderer/renderer";

export class Engine extends EventTarget {
  entities: Array<number[]> = [];
  systems: System[] = [];

  renderer: Helios2Renderer;
  pointerManager: PointerManager;

  canvas: HTMLCanvasElement;

  ecs: ECS;

  constructor(canvas: HTMLCanvasElement) {
    super();
    // canvas.width = window.innerWidth;
    // canvas.height = window.innerHeight;

    this.canvas = canvas;

    this.ecs = new ECS();
    this.pointerManager = new PointerManager();
  }

  async load() {
    await this.ecs.loadNativeComponents();
    await this.ecs.loadComponents();
  }

  async start() {
    await Promise.all(
      this.systems.map((system) =>
        system.start ? system?.start(this) : Promise.resolve(),
      ),
    );

    startLifecycle(this.update.bind(this));
  }

  async update(delta: number) {
    this.dispatchEvent(new CustomEvent("update", { detail: delta }));

    this.systems.forEach((x) => {
      if (x.update) {
        x.update(this.entities, delta, this);
      }
    });
    this.systems.forEach((x) => {
      if (x.afterUpdate) {
        x?.afterUpdate(this);
      }
    });
  }

  createEntity(): number {
    return this.entities.push([]) - 1;
  }

  ofEntity(id: number) {
    return this.entities[id];
  }

  public on = this.addEventListener;

  query(...componentTypes: (new (...args: any[]) => Component)[]): number[] {
    const ids = componentTypes.map((ct) => (ct as any).id);
    const result: number[] = [];

    for (let i = 0; i < this.entities.length; i++) {
      const entity = this.entities[i];
      let hasAll = true;

      for (let j = 0; j < ids.length; j++) {
        if (entity[ids[j]] === undefined) {
          hasAll = false;
          break;
        }
      }

      if (hasAll) {
        result.push(i);
      }
    }

    return result;
  }

  addComponent<T extends Component>(
    entityId: number,
    component: ClassConstructor<T>,
    args: any[] = [],
  ) {
    const componentTypeid = (component as any).id as number;
    const componentId = this.ecs.pushComponent<T>(component, args) as number;

    this.entities[entityId][componentTypeid] = componentId;

    return componentId;
  }
}
