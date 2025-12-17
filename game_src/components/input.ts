import { Component } from "../../src/ecs/component";
import {
  hot,
  Serializable,
  serializable,
} from "../../src/opulence-ecs/component-gen";

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
  @hot.boolean
  LMB: boolean = false;
  @hot.boolean
  RMB: boolean = false;
  @hot.boolean
  MMB: boolean = false;
  // @hot.serialized(SerializableVec2)
  // mousePosition = new SerializableVec2(0, 0);

  // LMBStart = { x: 0, y: 0 };
  // RMBStart = { x: 0, y: 0 };
  // MMBStart = { x: 0, y: 0 };

  // clickedRMB: boolean = false;
  // clickedLMB: boolean = false;
  // clickedMMB: boolean = false;

  // scrolled: number = 0;
}
