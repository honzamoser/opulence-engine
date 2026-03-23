import { MeshComponent } from "@generated"
import { System } from "../../../src/ecs/system";
import { Engine } from "../../../src/engine";
import { ColliderComponent, TransformComponent } from "@generated"
import { createCube, createPlane } from "../../../src/renderer/primitive";
import { namespace } from "../../../src/ecs/component-gen";
import {RigidbodyComponent} from "@generated";
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

    const floor = createPlane();
    const floorMesh = engine.renderer.uploadMesh(
      floor.vertices,
      floor.indices,
      floor.normals,
    ); // Nahrajeme podlahu na grafickou kartu

    

    this.c_playerEnt = engine.createEntity(); // Vytvoříme entitu pro hráče
    const floorEnt = engine.createEntity(); // Vytvoříme entitu pro podlahu

    TransformComponent.CURSOR = 0;
    TransformComponent.NEXT = 0;

    engine.addComponent<MeshComponent>(this.c_playerEnt, MeshComponent, { meshId: cubeMesh, color: new Float32Array([1, 0, 0]) }); // Přidáme komponentu MeshComponent s krychlí
    engine.addComponent<TransformComponent>(this.c_playerEnt, TransformComponent, { position: new Float32Array([0, 0, 0]), rotation: new Float32Array([0, 45 / 180 * Math.PI, 0]), scale: new Float32Array([1, 1, 1]) }); // Přidáme komponentu TransformComponent s počáteční pozicí, rotací a škálou
    engine.addComponent<RigidbodyComponent>(this.c_playerEnt, RigidbodyComponent, { mass: 1 }); // Přidáme komponentu RigidbodyComponent s hmotností 1
    engine.addComponent<ColliderComponent>(this.c_playerEnt, ColliderComponent, { size: new Float32Array([1, 1, 1]), offset: new Float32Array([0, 0, 0]), shapeType: 2}); // Přidáme komponentu ColliderComponent s velikostí a offsetem

    ColliderComponent.vertices = cube.vertices;
    console.log(ColliderComponent.CURSOR, ColliderComponent.vertices);


    console.log(TransformComponent.CURSOR, TransformComponent.NEXT, TransformComponent.positionZ);
    
    engine.addComponent<MeshComponent>(floorEnt, MeshComponent, { meshId: floorMesh, color: new Float32Array([0.5, 0.5, 0.5]) }); // Přidáme komponentu MeshComponent s podlahou
    engine.addComponent<TransformComponent>(floorEnt, TransformComponent, { position: new Float32Array([0, -5, 0]), rotation: new Float32Array([0, 0, 0]), scale: new Float32Array([20, 1, 20]) }); // Přidáme komponentu TransformComponent s pozicí podlahy
    engine.addComponent<RigidbodyComponent>(floorEnt, RigidbodyComponent, { isStatic: true }); // Přidáme komponentu TransformComponent s pozicí podlahy
    engine.addComponent<ColliderComponent>(floorEnt, ColliderComponent, { size: new Float32Array([20, 1, 20]), offset: new Float32Array([0, 0, 0]), shapeType: 1 }); // Přidáme komponentu ColliderComponent s velikostí a offsetem
    console.log(TransformComponent.CURSOR, TransformComponent.NEXT, TransformComponent.positionZ);

    ColliderComponent.vertices = floor.vertices;
    console.log(ColliderComponent.CURSOR, ColliderComponent.vertices);

    console.log("Player Entity Created:", RigidbodyComponent.velocity);
    }

  public update(
    entities: number[][],
    delta: number,
    engine: Engine,
  ): void {
    const transformComponent = TransformComponent.to(engine.entities[this.c_playerEnt][TransformComponent.IDENTIFIER]);
  }
}
