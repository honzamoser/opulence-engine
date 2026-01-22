import { MeshComponent } from "@generated/mesh"
import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { TransformComponent } from "@generated"
import { createCube } from "../../src/renderer/primitive";
import { namespace } from "../../src/ecs/component-gen";
import {RigidbodyComponent} from "@generated";
import { log_component, log_entity } from "../../src/debug/ecs_debug";


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

    this.c_playerEnt = engine.createEntity(); // Vytvoříme entitu pro hráče

    TransformComponent.CURSOR = 0;
    TransformComponent.NEXT = 0;

    engine.addComponent<MeshComponent>(this.c_playerEnt, MeshComponent, { meshId: cubeMesh }); // Přidáme komponentu MeshComponent s krychlí
    engine.addComponent<TransformComponent>(this.c_playerEnt, TransformComponent, { position: new Float32Array([0, 0, -10]), rotation: new Float32Array([0, 0, 0]), scale: new Float32Array([1, 1, 1]) }); // Přidáme komponentu TransformComponent s počáteční pozicí, rotací a škálou
    engine.addComponent<RigidbodyComponent>(this.c_playerEnt, RigidbodyComponent, { mass: 1 }); // Přidáme komponentu RigidbodyComponent s hmotností 1
    }

  public update(
    entities: number[][],
    delta: number,
    engine: Engine,
  ): void {
    // const transformComponent = engine.ecs.__getComponent(TransformComponent, this.c_playerEnt)!; // Získáme TransformComponent hráče
    // transformComponent.position[2] -= 0.01 * delta; // Posuneme hráče vpřed podél osy Z
    // console.log(log_component(engine, this.c_playerEnt, RigidbodyComponent));

    const transformComponent = TransformComponent.to(engine.entities[this.c_playerEnt][TransformComponent.IDENTIFIER]);
    transformComponent.rotation[1] +=  delta;
    transformComponent.rotation[0] +=  delta / 2;
    transformComponent.rotation[2] +=  delta / 3;

    // new MeshComponentAccessor().

  }
}
