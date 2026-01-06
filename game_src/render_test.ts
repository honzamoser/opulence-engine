import { mat4 } from "wgpu-matrix";
import { CullingPass } from "../src/helios-renderer/passes/culling.pass";
import { ResetPass } from "../src/helios-renderer/passes/indirect_reset.pass";
import { MainDrawPass } from "../src/helios-renderer/passes/main_draw.pass";
import { Helios2Renderer } from "../src/helios2-renderer/renderer";
import {
  createCube,
  createDiamond,
  createPyramid,
} from "../src/renderer/primitive";
import { document } from "@loaders.gl/core";

const canvas: HTMLCanvasElement = document.getElementById(
  "main",
) as HTMLCanvasElement;

const renderer = new Helios2Renderer(canvas);

renderer.initialize().then(() => {
  const cube = createCube();
  const cubeMesh = renderer.uploadMesh(
    cube.vertices,
    cube.indices,
    cube.normals,
  );

  const pyramidData = createPyramid();
  const pyramid = renderer.uploadMesh(
    pyramidData.vertices,
    pyramidData.indices,
    pyramidData.normals,
  );

  let instancesData = [];
  const instanceCount = 500;

  renderer._instantiate(
    cubeMesh,
    mat4.translation([0, 0, -10]),
    new Float32Array([1, 0, 0, 1]),
  );

  for (let i = 0; i < instanceCount; i++) {
    const translationMatrix = mat4.translation([
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    ]);
    const scale = Math.random() * 0.5 + 0.1;
    const scaleMatrix = mat4.scaling([scale, scale, scale]);
    const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

    instancesData.push({
      matrix: modelMatrix,
      color: new Float32Array([0, 1, 0, 1]),
    });
  }

  renderer._instantiateBatch(pyramid, instancesData);

  for (let i = 0; i < 150; i++) {
    const translationMatrix = mat4.translation([
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
    ]);
    const scale = Math.random() * 0.5 + 0.1;
    const scaleMatrix = mat4.scaling([scale, scale, scale]);
    const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

    // break;

    renderer._instantiate(
      cubeMesh,
      modelMatrix,
      new Float32Array([0, 0, 1, 1]),
    );
  }

  // instancesData = [];
  // for (let i = 0; i < instanceCount; i++) {
  //   const translationMatrix = mat4.translation([
  //     (Math.random() - 0.5) * 10,
  //     (Math.random() - 0.5) * 10,
  //     (Math.random() - 0.5) * 10,
  //   ]);
  //   const scale = Math.random() * 0.5 + 0.1;
  //   const scaleMatrix = mat4.scaling([scale, scale, scale]);
  //   const modelMatrix = mat4.multiply(translationMatrix, scaleMatrix);

  //   instancesData.push({
  //     matrix: modelMatrix,
  //     color: new Float32Array([1, 0, 0, 1]),
  //   });
  // }

  // renderer._instantiateBatch(pyramid, instancesData);

  let t = performance.now();
  let f = 0;

  function frame() {
    const dt = performance.now() - t;
    renderer.render(t);

    t = performance.now();
    f++;

    renderer.cameraRotation[1] += 0.01 * dt;

    requestAnimationFrame(frame);
  }

  setInterval(() => {
    fps.innerText = `FPS: ${f}`;
    f = 0;
  }, 1000);

  requestAnimationFrame(frame);
});

const fps = document.getElementById("fps") as HTMLDivElement;
export {};
