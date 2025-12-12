import { vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";

export class TransformComponent extends Component {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;

  constructor(
    position: Vec3 = vec3.create(0, 0, 0),
    rotation: Vec3 = vec3.create(0, 0, 0),
    scale: Vec3 = vec3.create(1, 1, 1),
  ) {
    super();
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }
}
