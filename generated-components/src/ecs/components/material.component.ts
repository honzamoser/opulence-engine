import { hot } from "../../opulence-ecs/component-gen";
import { Component } from "../component";
import { ECS } from "../../opulence-ecs/ecs";

export default class MaterialComponent extends Component {
  private _index: number;
  protected ECS: ECS;
  @hot.int32
  private _materialId: number;

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

  get materialId(): number {
    return this.ECS.getComponentValue(this.index, this, "materialId");
  }

  set materialId(value: number) {
    this.ECS.setComponentValue(this.index, this, "materialId", value);
  }
}
