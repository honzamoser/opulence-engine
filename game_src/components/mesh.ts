import { cold, hot } from "../../src/opulence-ecs/component-gen";

export default class MeshComponent {
  @cold.float32Array
  vertices: Float32Array;

  @hot.float32Array(64)
  texture: Float32Array;
}
