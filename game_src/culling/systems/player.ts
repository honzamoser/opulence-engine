import { MeshComponent } from "@generated"
import { System } from "../../../src/ecs/system";
import { Engine } from "../../../src/engine";
import { ColliderComponent, TransformComponent } from "@generated"
import { createCube, createPlane } from "../../../src/renderer/primitive";
import { namespace } from "../../../src/ecs/component-gen";
import { RigidbodyComponent } from "@generated";
import { log_component, log_entity } from "../../../src/debug/ecs_debug";
import { Collider } from "@dimforge/rapier3d";


@namespace("game.PlayerSystem")
export class PlayerSystem extends System {

  c_playerEnt: number;

  public start(engine: Engine): void {
    const cube = createCube(); // Geometrická data pro krychli
    const cubeMesh = engine.renderer.uploadMesh(
      cube.vertices,
      cube.indices,
      cube.normals,
    ); // Nahrajeme krychli na grafickou kartu

    let entCount = 1500;

    for (let i = 0; i < entCount; i++) {
      const entity = engine.createEntity(); // Vytvoříme entitu
      engine.addComponent(entity, MeshComponent, {
        color: new Float32Array([Math.random(), Math.random(), Math.random()]),
        meshId: cubeMesh,
        batch: true,
      });

      engine.addComponent(entity, TransformComponent, {
        position: new Float32Array([
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
        ]),
        rotation: new Float32Array([0, 0, 0]),
        scale: new Float32Array([1, 1, 1]),
        batch: true,
      });
    }
  }

  public update(
    entities: number[][],
    delta: number,
    engine: Engine,
  ): void {
    // const transformComponent = engine.ecs.__getComponent(TransformComponent, this.c_playerEnt)!; // Získáme TransformComponent hráče
    // transformComponent.position[2] -= 0.01 * delta; // Posuneme hráče vpřed podél osy Z
    // console.log(log_component(engine, this.c_playerEnt, RigidbodyComponent));




    // transformComponent.rotation[1] +=  delta;
    // transformComponent.rotation[0] +=  delta / 2;
    // transformComponent.rotation[2] +=  delta / 3;

    // new MeshComponentAccessor().

  }
}
