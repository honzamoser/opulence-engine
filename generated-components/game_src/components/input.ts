import { Component } from "../../src/ecs/component";
import {
  hot,
  Serializable,
  serializable,
} from "../../src/opulence-ecs/component-gen";
import { ECS } from "../../src/opulence-ecs/ecs";

@serializable
class SerializableVec2 extends Serializable<SerializableVec2> {
  serialize(v: SerializableVec2): ArrayBuffer {
    throw new Error("Method not implemented.");
  }
  @hot.int32
  x: number;
  @hot.int32
  y: number;

  constructor(x: number, y: number) {
    super();
    this.x = x;
    this.y = y;
  }

  deserialize(buffer: ArrayBuffer): void {}
}

export default class InputComponent extends Component {
    private _index: number;
    protected ECS: ECS;
  @hot.boolean
  private _LMB: boolean = false;
  @hot.boolean
  private _RMB: boolean = false;
  @hot.boolean
  private _MMB: boolean = false;
  // @hot.serialized(SerializableVec2)
  // mousePosition = new SerializableVec2(0, 0);

  // LMBStart = { x: 0, y: 0 };
  // RMBStart = { x: 0, y: 0 };
  // MMBStart = { x: 0, y: 0 };

  // clickedRMB: boolean = false;
  // clickedLMB: boolean = false;
  // clickedMMB: boolean = false;

  // scrolled: number = 0;
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

    get LMB(): boolean {
        return this.ECS.getComponentValue(this.index, this, "LMB");
    }

    set LMB(value: boolean) {
        this.ECS.setComponentValue(this.index, this, "LMB", value)
    }

    get RMB(): boolean {
        return this.ECS.getComponentValue(this.index, this, "RMB");
    }

    set RMB(value: boolean) {
        this.ECS.setComponentValue(this.index, this, "RMB", value)
    }

    get MMB(): boolean {
        return this.ECS.getComponentValue(this.index, this, "MMB");
    }

    set MMB(value: boolean) {
        this.ECS.setComponentValue(this.index, this, "MMB", value)
    }
}
