import { Engine } from "../src/engine";
import { Helios2Renderer } from "../src/renderer/renderer";

import RenderSystem from "../src/ecs/systems/render";
import { PlayerSystem } from "./systems/player";
import PhysicsSystem from "../src/ecs/systems/physics";

const canvas: HTMLCanvasElement = document.getElementById(
  "main",
) as HTMLCanvasElement;

const renderer = new Helios2Renderer(canvas);
const engine = new Engine(canvas);

engine.renderer = renderer;

engine.load().then(() => {
  renderer.initialize().then(() => {
    engine.systems.push(new RenderSystem(renderer));
    engine.systems.push(new PlayerSystem());
    // engine.systems.push(new PhysicsSystem());

    engine.start(); 
  });
});

export { };
