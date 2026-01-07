import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { constructor, hot } from "../../opulence-ecs/component-gen";

export default class TransformComponent extends Component {
  @constructor(0)
  @hot.float32Array(3)
  position: Vec3;
  @constructor(1)
  @hot.float32Array(3)
  rotation: Vec3 = vec3.create(0, 0, 0);
  @constructor(2)
  @hot.float32Array(3)
  scale: Vec3 = vec3.create(1, 1, 1);
  @hot.float32Array(16)
  matrix: Mat4 = mat4.identity();
}
