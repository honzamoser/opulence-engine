import { Engine } from "../engine";
import { Entity } from "../entity";

export abstract class System {
  public abstract update?(
    entities: Entity[],
    delta: number,
    engine: Engine,
  ): Promise<void>;
  public abstract start?(engine: Engine): Promise<void>;
}
