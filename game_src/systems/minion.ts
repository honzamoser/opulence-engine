import { vec3 } from "wgpu-matrix";
import { TransformComponent } from "../../src/ecs/components/transform";
import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { Entity } from "../../src/entity";
import MinionComponent from "../components/minion";
import PlayerComponent from "../components/player";

export class MinionSystem extends System {
  player: Entity | null = null;

  public start(engine: Engine): void {
    // this.player =
  }

  public update(entities: Entity[], delta: number, engine: Engine): void {
    let player = engine.query(PlayerComponent, TransformComponent)[0] || null;

    const minionComponents = engine.query(MinionComponent, TransformComponent);
    const playerTransform = player.getComponent(TransformComponent)!;

    minionComponents.forEach((entity, index) => {
      const minionTransform = entity.getComponent(TransformComponent)!;

      // Simple follow logic: move minion towards player position
      const direction = vec3.subtract(
        playerTransform.position,
        minionTransform.position,
      );
      const length = vec3.length(direction);
      if (length > 0.1) {
        direction[0] /= length;
        direction[1] /= length;
        direction[2] /= length;

        // Move minion towards player
        const speed = 0.001; // units per second
        vec3.add(
          minionTransform.position,
          vec3.scale(direction, speed * delta),
          minionTransform.position,
        );

        minionTransform.computeTransform();
      }
    });
  }
}
