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
  world: Entity[] = [];
  input: InputHandler;
  cameraPosition = vec3.create(0, 10, 20);
  renderer: Renderer;
  pointerManager: PointerManager;

  canvas: HTMLCanvasElement;

  systems: System[] = [];

  componentStore: Map<new (...args: any[]) => Component, ArrayBuffer> =
    new Map();

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

    const ecs = new ECS();

    startLifecycle(this.update.bind(this));
  }

  async start() {
    await Promise.all(
      this.systems.map((system) =>
        system.start ? system?.start(this) : Promise.resolve(),
      ),
    );
  }

  async update(delta: number) {
    this.dispatchEvent(new CustomEvent("update", { detail: delta }));

    // Clear query cache at start of frame
    if (this.queryCacheDirty) {
      this.queryCache.clear();
      this.queryCacheDirty = false;
    }

    this.systems.forEach((x) => {
      if (x.update) {
        x.update(this.world, delta, this);
      }
    });
    this.systems.forEach((x) => {
      if (x.afterUpdate) {
        x?.afterUpdate(this);
      }
    });
  }

  createEntity(): Entity {
    const ent = new Entity(this);
    this.world.push(ent);
    this.queryCacheDirty = true; // Invalidate cache when entities change
    return ent;
  }

  public on = this.addEventListener;

  query(...componentTypes: (new (...args: any[]) => Component)[]): Entity[] {
    // Create cache key from component type names
    const cacheKey = componentTypes
      .map((t) => t.name)
      .sort()
      .join(",");

    // Check cache first
    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    // Perform query and cache result
    const result = this.world.filter((entity) =>
      componentTypes.every((type) => entity.hasComponent(type)),
    );

    this.queryCache.set(cacheKey, result);
    return result;
  }

  // Call this when an entity's components are modified
  invalidateQueryCache(): void {
    this.queryCacheDirty = true;
  }
}
