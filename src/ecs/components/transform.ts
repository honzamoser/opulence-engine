import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import {
  constructor,
  defaultValue,
  hot,
} from "../../opulence-ecs/component-gen";

export default class TransformComponent extends Component {
  @constructor(0)
  @hot.float32Array(3)
  position: Vec3;
  @constructor(1)
  @hot.float32Array(3)
  rotation: Vec3;
  @constructor(2)
  @hot.float32Array(3)
  scale: Vec3;
  @hot.float32Array(16)
  matrix: Mat4;

  // constructor(
  //   position: Vec3 = vec3.create(0, 0, 0),
  //   rotation: Vec3 = vec3.create(0, 0, 0),
  //   scale: Vec3 = vec3.create(1, 1, 1),
  // ) {
  //   super();
  //   this.position = position;
  //   this.rotation = rotation;
  //   this.scale = scale;
  //   this.matrix = mat4.create();

  //   this.computeTransform();
  // }

  // computeTransform() {
  //   mat4.identity(this.matrix);
  //   mat4.translate(this.matrix, this.position, this.matrix);
  //   mat4.rotateX(this.matrix, this.rotation[0], this.matrix);
  //   mat4.rotateY(this.matrix, this.rotation[1], this.matrix);
  //   mat4.rotateZ(this.matrix, this.rotation[2], this.matrix);
  //   mat4.scale(this.matrix, this.scale, this.matrix);
  // }
}
