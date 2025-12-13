import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";

export class CameraComponent extends Component {
  fov: number = Math.PI / 2;
  near: number = 0.1;
  far: number = 1000;

  projectionMatrix: Mat4;

  constructor() {
    super();
    this.projectionMatrix = mat4.create();
  }
}
