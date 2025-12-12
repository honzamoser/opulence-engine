import { vec2, vec3 } from "wgpu-matrix";
import { Engine } from "./src/engine.js";
import { Mesh } from "./src/renderer/mesh.js";
import { createCube, createPlane } from "./src/renderer/primitive.js";
import { Renderer } from "./src/renderer/renderer.js";
import { Entity } from "./src/entity.js";
import {
  createRayFromMouse,
  HitResult,
  rayIntersectEntity,
} from "./src/physics/raycast.js";

const canvas: HTMLCanvasElement = document.getElementById(
  "main",
) as HTMLCanvasElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

fetch("./resources/shaders/basic_lit.wgsl").then(async (res) => {
  const shader = await res.text();
  const engine = new Engine(canvas, shader);

  engine.addEventListener("ready", () => {
    let e: Entity = engine.createEntity(
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(1, 1, 1),
      createCube(engine.renderer.device!),
    );

    let obstruction = engine.createEntity(
      vec3.fromValues(10, 2, -2),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(5, 3, 1),
      createCube(engine.renderer.device!),
    );

    let floor = engine.createEntity(
      vec3.fromValues(0, -2, 0),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(50, 0.1, 50),
      createPlane(engine.renderer.device!),
    );

    engine.on("update", () => {
      e.rotation[0] += 0.01;
      e.rotation[1] += 0.01;
      e.computeTransform();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "arrowleft" || e.key === "a") {
        engine.cameraPosition[0] -= 1;
      }
      if (e.key === "arrowright" || e.key === "d") {
        engine.cameraPosition[0] += 1;
      }
      if (e.key === "arrowup" || e.key === "w") {
        engine.cameraPosition[2] -= 1;
      }
      if (e.key === "arrowdown" || e.key === "s") {
        engine.cameraPosition[2] += 1;
      }

      if (e.key === "q") {
        engine.cameraPosition[1] += 1;
      }

      if (e.key === "e") {
        engine.cameraPosition[1] -= 1;
      }
    });

    window.addEventListener("click", (ev) => {
      const ray = createRayFromMouse(
        window.event
          ? vec2.fromValues(window.event.clientX, window.event.clientY)
          : vec2.fromValues(0, 0),
        vec2.fromValues(canvas.width, canvas.height),
        engine.renderer.getViewProjectionMatrix(engine.cameraPosition),
        engine.cameraPosition,
      );

      let closestHit: HitResult | null = null;
      let closestEntity: Entity | null = null;

      for (const entity of [floor, obstruction]) {
        const hit = rayIntersectEntity(ray, entity);

        if (hit) {
          if (!closestHit || hit.distance < closestHit.distance) {
            closestHit = hit;
            closestEntity = entity;
          }
        }
      }

      if (closestHit && closestEntity == floor) {
        console.log(
          "Hit at: ",
          closestHit.point,
          " on entity: ",
          closestEntity,
        );
      }
    });
  });
});

// let cubeMesh: Mesh;

// const renderer = new Renderer(
//   canvas,
//   document.getElementById("shader").textContent,
// );
// renderer.initialize().then(() => {
//   if (renderer.device) {
//     cubeMesh = createCube(renderer.device);
//   }

//   function frame(t) {
//     renderer.render(cubeMesh, t);
//     requestAnimationFrame(frame);
//   }

//   requestAnimationFrame(frame);
// });
