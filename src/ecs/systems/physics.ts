import { Engine } from "../../engine";
import { ColliderComponent, RigidbodyComponent, TransformComponent } from "@generated";
import { System } from "../system";

export default class PhysicsSystem extends System {
    public update(entities: Array<number[]>, delta: number, engine: Engine): void {
        const rigidBodies = engine.query(RigidbodyComponent, TransformComponent, ColliderComponent);

        for (const entityId of rigidBodies) {
            this.simulateRigidBody(entityId, delta, engine);

        }
    }

    simulateRigidBody(entityId: number, delta: number, engine: Engine) {
        const rigidBody = RigidbodyComponent.to(entityId);

        //TODO: Collisions

        if (rigidBody.isStatic) return;

        const transform = TransformComponent.to(entityId);
        const collider = ColliderComponent.to(entityId);

        // Update position based on velocity
        transform.positionX += rigidBody.velocityX * delta;
        transform.positionY += rigidBody.velocityY * delta;
        transform.positionZ += rigidBody.velocityZ * delta;

        if (transform.positionY < -4) {
            // transform.positionY = 0;
            rigidBody.velocityY = -0.5 * rigidBody.velocityY; // simple bounce with energy loss
            transform.positionY = -4;
        } else {
            rigidBody.velocityY -= 1.81 * delta;
        }

        // Simple gravity effect

    }
}