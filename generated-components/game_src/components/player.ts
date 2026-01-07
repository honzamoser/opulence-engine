import { Vec3 } from "wgpu-matrix";
import { Component } from "../../src/ecs/component";
import { hot } from "../../src/opulence-ecs/component-gen";
import { ECS } from "../../src/opulence-ecs/ecs";

export default class PlayerComponent extends Component {
    private _index: number;
    protected ECS: ECS;
  @hot.float32Array(3)
  private _destination: Vec3 | null = null;
  @hot.float32
  private _speed: number = 0.01;

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

    get destination(): Vec3 | null {
        return this.ECS.getComponentValue(this.index, this, "destination");
    }

    set destination(value: Vec3 | null) {
        this.ECS.setComponentValue(this.index, this, "destination", value)
    }

    get speed(): number {
        return this.ECS.getComponentValue(this.index, this, "speed");
    }

    set speed(value: number) {
        this.ECS.setComponentValue(this.index, this, "speed", value)
    }
}
