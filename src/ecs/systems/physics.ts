import { Engine } from "../../engine";
import { ColliderComponent, RigidbodyComponent, TransformComponent } from "@generated";
import { System } from "../system";
import * as CANNON from "cannon-es"

window.plug = {}
window.plug.gravity = 9.81;

export default class PhysicsSystem extends System {

    world: CANNON.World;

    public update(entities: Array<number[]>, delta: number, engine: Engine): void {
        const rigidBodies = engine.query(RigidbodyComponent, TransformComponent, ColliderComponent);

        for (const entityId of rigidBodies) {
            ColliderComponent.to(entityId)
            TransformComponent.to(entityId)
            RigidbodyComponent.to(entityId)

            if(RigidbodyComponent.isStatic) continue;

            this.simulateRigidbody(entityId, delta, engine);
            

            // console.log(ColliderComponent.CURSOR, ColliderComponent.vertices)
        }
    }

    simulateRigidbody(entityId: number, delta: number, engine: Engine) {
        // console.log(delta)
        delta = delta / 10; // Převod z milisekund na sekundy

        if(TransformComponent.positionY <= -4) {
            RigidbodyComponent.velocityY = -RigidbodyComponent.velocityY * 0.5; // Odbounce při kolizi se zemí
            TransformComponent.positionY = -4; // Zajistíme, že se objekt nezanoří pod zem
        }
 
        RigidbodyComponent.velocityY -= window.plug.gravity * delta; // Jednoduchá gravitace

        TransformComponent.positionY += RigidbodyComponent.velocityY * delta; // Aktualizace pozice na základě rychlosti
        
    }

}