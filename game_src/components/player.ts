import { Vec3 } from "wgpu-matrix";
import { Component } from "../../src/ecs/component";

export class PlayerComponent extends Component {
  destination: Vec3 | null = null;
  speed: number = 0.01;
}
