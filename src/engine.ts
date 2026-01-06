import { Entity } from "./entity";
import { InputHandler } from "./input";
import { startLifecycle } from "./lifecycle";
import { vec2, vec3, Vec3 } from "wgpu-matrix";
import { Renderer } from "./renderer/renderer";
import { Mesh } from "./renderer/mesh";
import { Light } from "./renderer/light";
import { System } from "./ecs/system";
import { Component } from "./ecs/component";
import { PointerManager } from "./data/arrayBufferPointer";
import { ECS } from "./opulence-ecs/ecs";

export class Engine extends EventTarget {
  world: [][] = [];
  input: InputHandler;
  cameraPosition = vec3.create(0, 10, 20);
  renderer: Renderer;
  pointerManager: PointerManager;

  canvas: HTMLCanvasElement;

  ecs: ECS;

  systems: System[] = [];

  // Query cache to avoid re-scanning entities every frame
  private queryCache: Map<string, Entity[]> = new Map();
  private queryCacheDirty: boolean = true;

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    super();

    this.pointerManager = new PointerManager();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvas = canvas;
    this.input = new InputHandler(canvas);

    this.ecs = new ECS();
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

    // Clear query cache at start of frame
    if (this.queryCacheDirty) {
      this.queryCache.clear();
      this.queryCacheDirty = false;
    }

    this.systems.forEach((x) => {
      // if (x.update) {
      //   x.update(this.world, delta, this);
      // }
    });
    this.systems.forEach((x) => {
      if (x.afterUpdate) {
        x?.afterUpdate(this);
      }
    });
  }

  createEntity(): number {
    return this.world.push([]);
  }

  public on = this.addEventListener;

  query(...componentTypes: (new (...args: any[]) => Component)[]): number[] {
    const ids = this.ecs.getComponentID(componentTypes);
    // Create cache key from component type names
    //
    console.log(ids);

    console.log(this.world);

    return this.world
      .find((entity, entityId) => {
        for (let id of ids) {
          if (entity[id] !== undefined && entity[id].length > 0) {
            return true;
          } else return false;
        }
      })
      .map((entityData, entityId) => {
        return entityId;
      });
  }

  addComponent(entityId: number, component: () => Component, args: any[]) {
    const componentTypeid = this.ecs.getComponentID([component])[0];
    const componentId = this.ecs.pushComponent<Component>(component, args);

    console.log(this.world[entityId], this.world, entityId)

    this.world[entityId][componentTypeid] = componentId;
  }
}
