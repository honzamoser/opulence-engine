/// <reference types="@webgpu/types" />

import { Texture } from "./components/texture";
import { Entity } from "./entity";
import { InputHandler } from "./input";
import { startLifecycle } from "./lifecycle";
import { Renderer } from "./renderer";
import { Vector2 } from "./types/vector2";

const world = {
    entities: [] as Entity[]
}

const canvas = document.getElementById("main") as HTMLCanvasElement;
const input = new InputHandler();

canvas.width = window.innerWidth
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

const renderer = new Renderer();
await renderer.initializeWebGpu(canvas);

// Create an entity with a texture
const ent = new Entity(new Vector2(320, 240), 0, new Vector2(100, 100));
// Use a simple red pixel data URI
const texture = new Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==");
await texture.load(renderer.device!);
ent.components.push(texture);
world.entities.push(ent);

const cameraPosition = new Vector2(0, 0);

startLifecycle((delta) => {
    // Rotate the entity
    // ent.rotation += delta * 0.001;
    
    // Move camera slightly to demonstrate
    // cameraPosition.x = Math.sin(Date.now() / 1000) * 50;

    world.entities.forEach((entity) => {
        if(input.isKeyPressed("ArrowRight")) {
            cameraPosition.x += 0.1 * delta;
        }
        if(input.isKeyPressed("ArrowLeft")) {
            cameraPosition.x -= 0.1 * delta;
        }
        if(input.isKeyPressed("ArrowUp")) {
            cameraPosition.y -= 0.1 * delta;
        }
        if(input.isKeyPressed("ArrowDown")) {
            cameraPosition.y += 0.1 * delta;
        }

        entity.update(delta);
    });

    renderer.renderEntities(world.entities, cameraPosition);
})

console.log("Hello");
