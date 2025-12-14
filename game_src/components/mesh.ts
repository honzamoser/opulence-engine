import {
  component,
  dataType,
  dynamic,
  frequent,
  infrequent,
} from "../../src/opulence-ecs/component-gen";

import "reflect-metadata";

export default class MeshComponent {
  @dynamic(dataType.float32Array, 1024)
  @infrequent
  vertices: Float32Array;
}
