import { MeshComponent } from "@generated"
import { System } from "../../../src/ecs/system";
import { Engine } from "../../../src/engine";
import { ColliderComponent, TransformComponent } from "@generated"
import { createCube, createPlane } from "../../../src/renderer/primitive";
import { namespace } from "../../../src/ecs/component-gen";
import { RigidbodyComponent } from "@generated";


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

    const cubeCount = 500;
    this.c_playerEnt = -1;
    const floorEnt = engine.createEntity(); // Vytvoříme entitu pro podlahu

    TransformComponent.CURSOR = 0;
    TransformComponent.NEXT = 0;

    for (let i = 0; i < cubeCount; i++) {
      const entity = engine.createEntity();
      if (this.c_playerEnt === -1) this.c_playerEnt = entity;

      const x = (Math.random() - 0.5) * 36;
      const y = 2 + Math.random() * 35;
      const z = (Math.random() - 0.5) * 36;

      engine.addComponent<MeshComponent>(entity, MeshComponent, {
        meshId: cubeMesh,
        color: new Float32Array([
          0.2 + Math.random() * 0.8,
          0.2 + Math.random() * 0.8,
          0.2 + Math.random() * 0.8,
        ]),
      });
      engine.addComponent<TransformComponent>(entity, TransformComponent, {
        position: new Float32Array([x, y, z]),
        rotation: new Float32Array([0, 0, 0]),
        scale: new Float32Array([1, 1, 1]),
      });
      engine.addComponent<RigidbodyComponent>(entity, RigidbodyComponent, {
        mass: 1,
      });
      engine.addComponent<ColliderComponent>(entity, ColliderComponent, {
        size: new Float32Array([1, 1, 1]),
        offset: new Float32Array([0, 0, 0]),
        shapeType: 2,
      });

      ColliderComponent.vertices = cube.vertices;
    }
    
    engine.addComponent<MeshComponent>(floorEnt, MeshComponent, { meshId: floorMesh, color: new Float32Array([0.5, 0.5, 0.5]) }); // Přidáme komponentu MeshComponent s podlahou
    engine.addComponent<TransformComponent>(floorEnt, TransformComponent, { position: new Float32Array([0, -5, 0]), rotation: new Float32Array([0, 0, 0]), scale: new Float32Array([50, 1, 50]) }); // Přidáme komponentu TransformComponent s pozicí podlahy
    engine.addComponent<RigidbodyComponent>(floorEnt, RigidbodyComponent, { isStatic: true }); // Přidáme komponentu TransformComponent s pozicí podlahy
    engine.addComponent<ColliderComponent>(floorEnt, ColliderComponent, { size: new Float32Array([20, 1, 20]), offset: new Float32Array([0, 0, 0]), shapeType: 1 }); // Přidáme komponentu ColliderComponent s velikostí a offsetem
    ColliderComponent.vertices = floor.vertices;
  }

  public update(
    entities: number[][],
    delta: number,
    engine: Engine,
  ): void {
    // Physics system drives movement; no per-frame game logic required here.
  }
}
