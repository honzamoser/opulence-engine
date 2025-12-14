import {
  component,
  dataType,
  dynamic,
  frequent,
} from "../../src/opulence-ecs/component-gen";

import "reflect-metadata";

export default class TransformComponent {
  @dynamic(dataType.float32Array, 3)
  @frequent
  position: Float32Array;

  @dynamic(dataType.float32Array, 4)
  @frequent
  rotation: Float32Array;

  @dynamic(dataType.float32Array, 3)
  @frequent
  scale: Float32Array;

  @dynamic(dataType.float32Array, 16)
  @frequent
  matrix: Float32Array;
}
