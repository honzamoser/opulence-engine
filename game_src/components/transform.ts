import {
  dataType,
  dynamic,
  hot,
  cold,
} from "../../src/opulence-ecs/component-gen";

export default class TransformComponent {
  @hot.float32Array(3)
  position: Float32Array;

  @hot.float32Array(4)
  rotation: Float32Array;

  @hot.float32Array(3)
  scale: Float32Array;

  @hot.float32Array(16)
  matrix: Float32Array;
}
