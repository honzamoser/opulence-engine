import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { constructor, hot } from "../../opulence-ecs/component-gen";
import { ECS } from "../../opulence-ecs/ecs";

export default class TransformComponent extends Component {
    private _index: number;
    protected ECS: ECS;
  @constructor(0)
  @hot.float32Array(3)
  private _position: Vec3;
  @constructor(1)
  @hot.float32Array(3)
  private _rotation: Vec3 = vec3.create(0, 0, 0);
  @constructor(2)
  @hot.float32Array(3)
  private _scale: Vec3 = vec3.create(1, 1, 1);
  @hot.float32Array(16)
  private _matrix: Mat4 = mat4.identity();

    constructor(idat: number) {
        super();
        this.ECS = ECS.instance; this._index = idat;
    }

    get index(): number {
        return this.ECS.getComponentValue(this.index, this, "index");
    }

    set index(value: number) {
        this.ECS.setComponentValue(this.index, this, "index", value)
    }

    get position(): Vec3 {
        return this.ECS.getComponentValue(this.index, this, "position");
    }

    set position(value: Vec3) {
        this.ECS.setComponentValue(this.index, this, "position", value)
    }

    get rotation(): Vec3 {
        return this.ECS.getComponentValue(this.index, this, "rotation");
    }

    set rotation(value: Vec3) {
        this.ECS.setComponentValue(this.index, this, "rotation", value)
    }

    get scale(): Vec3 {
        return this.ECS.getComponentValue(this.index, this, "scale");
    }

    set scale(value: Vec3) {
        this.ECS.setComponentValue(this.index, this, "scale", value)
    }

    get matrix(): Mat4 {
        return this.ECS.getComponentValue(this.index, this, "matrix");
    }

    set matrix(value: Mat4) {
        this.ECS.setComponentValue(this.index, this, "matrix", value)
    }
}
