import { Entity } from "./entity";
import { InputHandler } from "./input";
import { startLifecycle } from "./lifecycle";
import { vec2, vec3, Vec3 } from "wgpu-matrix";
import { Renderer } from "./renderer/renderer";
import { Mesh } from "./renderer/mesh";
import { Light } from "./renderer/light";
import { System } from "./ecs/system";

export class Engine extends EventTarget {
  world: Entity[] = [];
  input: InputHandler;
  cameraPosition = vec3.create(0, 10, 20);
  renderer: Renderer;

  canvas: HTMLCanvasElement;

  systems: System[] = [];

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    super();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    this.canvas = canvas;
    this.input = new InputHandler(canvas);

    // this.renderer = new Renderer(canvas, shaderSource);
    // this.renderer.lights = [
    //   // Light.createPoint([3, 2, 0], 10, [1, 0, 0], 2), // Red point light
    //   // Light.createPoint([-3, 2, 0], 10, [0, 0, 1], 2), // Blue point light
    //   // Light.createPoint([0, 4, 2], 15, [0, 1, 0], 1), // Green point light
    //   Light.createDirectional([0, -1, 0], [1, 1, 0.9], 0.9), // Warm directional light (like sunlight)
    // ];
    // this.renderer.initialize().then(() => {
    //   this.dispatchEvent(new Event("ready"));
    // });
    startLifecycle(this.update.bind(this));
  }

  async start() {
    await Promise.all(this.systems.map((system) => system.start(this)));
  }

  update(delta: number) {
    this.dispatchEvent(new CustomEvent("update", { detail: delta }));

    console.log(this.systems);

    this.systems.forEach((entity) => {
      entity.update(this.world, delta, this);
    });

    // this.renderer.render(this.world, delta, this.cameraPosition);
  }

  createEntity(position: Vec3, rotation: Vec3, scale: Vec3): Entity {
    const ent = new Entity(this, position, rotation, scale);
    this.world.push(ent);
    return ent;
  }

  public on = this.addEventListener;
}
