import { dynamic, frequent } from "./component-gen";

export class TransformComponent {
  @dynamic(3)
  @frequent
  position: Float32Array;

  @dynamic(4)
  @frequent
  rotation: Float32Array;

  @dynamic(3)
  @frequent
  scale: Float32Array;

  @dynamic(16)
  @frequent
  matrix: Float32Array;
}
