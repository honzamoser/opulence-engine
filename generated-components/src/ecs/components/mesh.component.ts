import { vec3, Vec3 } from "wgpu-matrix";
import { constructor, hot } from "../../opulence-ecs/component-gen";
import { Component } from "../component";
import { ECS } from "../../opulence-ecs/ecs";

export default class MeshComponent extends Component {
    private _index: number;
    protected ECS: ECS;
  @hot.int32
  @constructor(0)
  private _meshId: number;

  @hot.int32
  private _rendererdInstasnceId: number;

  @hot.string(64)
  private _resourceIdentifier: string;

  @hot.float32Array(3)
  private _boundingBoxMin: Vec3 = vec3.create(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );

  @hot.float32Array(3)
  private _boundingBoxMax: Vec3 = vec3.create(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );

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

    get meshId(): number {
        return this.ECS.getComponentValue(this.index, this, "meshId");
    }

    set meshId(value: number) {
        this.ECS.setComponentValue(this.index, this, "meshId", value)
    }

    get rendererdInstasnceId(): number {
        return this.ECS.getComponentValue(this.index, this, "rendererdInstasnceId");
    }

    set rendererdInstasnceId(value: number) {
        this.ECS.setComponentValue(this.index, this, "rendererdInstasnceId", value)
    }

    get resourceIdentifier(): string {
        return this.ECS.getComponentValue(this.index, this, "resourceIdentifier");
    }

    set resourceIdentifier(value: string) {
        this.ECS.setComponentValue(this.index, this, "resourceIdentifier", value)
    }

    get boundingBoxMin(): Vec3 {
        return this.ECS.getComponentValue(this.index, this, "boundingBoxMin");
    }

    set boundingBoxMin(value: Vec3) {
        this.ECS.setComponentValue(this.index, this, "boundingBoxMin", value)
    }

    get boundingBoxMax(): Vec3 {
        return this.ECS.getComponentValue(this.index, this, "boundingBoxMax");
    }

    set boundingBoxMax(value: Vec3) {
        this.ECS.setComponentValue(this.index, this, "boundingBoxMax", value)
    }
}
