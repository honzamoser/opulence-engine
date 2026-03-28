import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { constructor, hot } from "../component-gen";

export default class TransformComponent extends Component {
  position: Vec3;
  rotation: Vec3 = vec3.create(0, 0, 0);
  scale: Vec3 = vec3.create(1, 1, 1);

  matrix: Mat4 = mat4.identity();
  batch: boolean = false;
}
