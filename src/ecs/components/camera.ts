import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { hot } from "../../opulence-ecs/component-gen";

export default class CameraComponent extends Component {
  @hot.float32
  fov: number = Math.PI / 2;
  @hot.float32
  near: number = 0.1;
  @hot.float32
  far: number = 1000;

  @hot.float32Array(16)
  projectionMatrix: Mat4;

  constructor() {
    super();
    this.projectionMatrix = mat4.create();
  }
}
