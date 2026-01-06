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

const canvas: HTMLCanvasElement = document.getElementById(
  "main",
) as HTMLCanvasElement;

const renderer = new Helios2Renderer(canvas);

renderer.initialize().then(() => {
  const cube = createCube();
  const cubeMesh = renderer.uploadMesh(cube.vertices, cube.indices);

  const instancesData = [];
  const instanceCount = 1000;

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
      color: new Float32Array([Math.random(), Math.random(), Math.random(), 1]),
    });
  }

  renderer._instantiateBatch(cubeMesh, instancesData);

  let t = 0;

  function frame() {
    renderer.render(t);
    t += 0.016;

    renderer.cameraRotation[1] += 1;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
});
