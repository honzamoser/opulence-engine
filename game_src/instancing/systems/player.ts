import { MeshComponent } from "@generated"
import { System } from "../../../src/ecs/system";
import { Engine } from "../../../src/engine";
import { TransformComponent } from "@generated"
import { createCube } from "../../../src/renderer/primitive";
import { namespace } from "../../../src/ecs/component-gen";
import RenderSystem from "../../../src/ecs/systems/render";


@namespace("game.PlayerSystem")
export class PlayerSystem extends System {

  private cubeMeshId: number;
  private renderSystem: RenderSystem;
  private cubeEntities: number[] = [];
  private activeCount = 0;
  private targetCount = 250;

  private static readonly MIN_INSTANCES = 10;
  private static readonly MAX_INSTANCES = 10000;

  public start(engine: Engine): void {
    const cube = createCube(); // Geometrická data pro krychli
    this.cubeMeshId = engine.renderer.uploadMesh(
      cube.vertices,
      cube.indices,
      cube.normals,
    ); // Nahrajeme krychli na grafickou kartu

    this.renderSystem = engine.systems.find(
      (x) => x instanceof RenderSystem,
    ) as RenderSystem;

    this.targetCount = this.readTargetCount();

    for (let i = 0; i < PlayerSystem.MAX_INSTANCES; i++) {
      this.cubeEntities.push(this.createCubeEntity(engine));
    }

    this.reconcileTargetCount(engine);
  }

  private createCubeEntity(engine: Engine): number {
    const entity = engine.createEntity();

    engine.addComponent(entity, MeshComponent, {
      color: new Float32Array([Math.random(), Math.random(), Math.random()]),
      meshId: this.cubeMeshId,
      batch: true,
    });

    engine.addComponent(entity, TransformComponent, {
      position: new Float32Array([
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 60,
      ]),
      rotation: new Float32Array([0, 0, 0]),
      scale: new Float32Array([1, 1, 1]),
      batch: true,
    });

    this.renderSystem.setEntityRenderEnabled(engine, entity, false);
    return entity;
  }

  private readTargetCount(): number {
    const plug = (window as any).plug;
    const requested = plug && typeof plug.instance_target === "number"
      ? plug.instance_target
      : this.targetCount;

    return Math.max(
      PlayerSystem.MIN_INSTANCES,
      Math.min(PlayerSystem.MAX_INSTANCES, Math.round(requested)),
    );
  }

  private reconcileTargetCount(engine: Engine) {
    while (this.activeCount < this.targetCount && this.activeCount < this.cubeEntities.length) {
      const entity = this.cubeEntities[this.activeCount];
      this.renderSystem.setEntityRenderEnabled(engine, entity, true);
      this.activeCount++;
    }

    while (this.activeCount > this.targetCount) {
      this.activeCount--;
      const entity = this.cubeEntities[this.activeCount];
      this.renderSystem.setEntityRenderEnabled(engine, entity, false);
    }
  }


  public update(
    entities: number[][],
    delta: number,
    engine: Engine,
  ): void {
    const nextTarget = this.readTargetCount();
    if (nextTarget !== this.targetCount) {
      this.targetCount = nextTarget;
      this.reconcileTargetCount(engine);
    }
  }
}
