import { Vec3 } from "wgpu-matrix";
import { Component } from "../../src/ecs/component";
import { hot } from "../../src/ecs/component-gen";

export default class MinionComponent extends Component {
  @hot.float32Array(3)
  targetLocation: Vec3 | null = null;
  @hot.float32
  speed: number = 0.005;
}
