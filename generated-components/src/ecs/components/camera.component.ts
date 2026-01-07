import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { hot } from "../../opulence-ecs/component-gen";
import { ECS } from "../../opulence-ecs/ecs";

export default class CameraComponent extends Component {
  private _index: number;
  protected ECS: ECS;
  @hot.float32
  private _fov: number = Math.PI / 2;
  @hot.float32
  private _near: number = 0.1;
  @hot.float32
  private _far: number = 1000;

  @hot.float32Array(16)
  static projectionMatrix: Mat4 = mat4.create();

  constructor(idat: number) {
    super();
    this.ECS = ECS.instance;
    this._index = idat;
  }

  get index(): number {
    return this.ECS.getComponentValue(this.index, this, "index");
  }

  set index(value: number) {
    this.ECS.setComponentValue(this.index, this, "index", value);
  }

  get fov(): number {
    return this.ECS.getComponentValue(this.index, this, "fov");
  }

  set fov(value: number) {
    this.ECS.setComponentValue(this.index, this, "fov", value);
  }

  get near(): number {
    return this.ECS.getComponentValue(this.index, this, "near");
  }

  set near(value: number) {
    this.ECS.setComponentValue(this.index, this, "near", value);
  }

  get far(): number {
    return this.ECS.getComponentValue(this.index, this, "far");
  }

  set far(value: number) {
    this.ECS.setComponentValue(this.index, this, "far", value);
  }
}
