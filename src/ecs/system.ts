import { Engine } from "../engine";
import { Entity } from "../entity";

export abstract class System {
  public abstract update?(
    entities: Array<number[]>,
    delta: number,
    engine: Engine,
  ): void;
  public abstract start?(engine: Engine): void;
  public abstract afterUpdate?(engine: Engine): void;
}
