import { Engine } from "../engine";

export class System {
  public update?(
    entities: Array<number[]>,
    delta: number,
    engine: Engine,
  ): void {
    return;
  };
  public start?(engine: Engine): void {
    return;
  };
  public afterUpdate?(engine: Engine): void {
    return;
  };
}
