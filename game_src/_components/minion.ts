import { Vec3 } from "wgpu-matrix";
import { Component } from "../../src/ecs/component";

export default class MinionComponent extends Component {
  targetLocation: Vec3 | null = null;
  speed: number = 0.005;
}
