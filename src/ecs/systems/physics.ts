import { Engine } from "../../engine";
import RigidbodyComponent from "../components/rigidbody.component";
import TransformComponent from "../components/transform.component";
import { System } from "../system";

export default class PhysicsSystem extends System {
    public update(entities: Array<number[]>, delta: number, engine: Engine): void {
        const rigidBodies = engine.query(RigidbodyComponent, TransformComponent);

    

        for (const entityId of rigidBodies) {
            this.simulateRigidBody(entityId, delta, engine);

        }
    }

    simulateRigidBody(entityId: number, delta: number, engine: Engine) {
        const rigidBody = engine.ecs.getComponent(RigidbodyComponent, entityId);
        const transform = engine.ecs.getComponent(TransformComponent, entityId);
        

        // Update position based on velocity
        engine.ecs.setComponentValue(
            engine.entities[entityId][TransformComponent.id],
            TransformComponent,
            "position",
            new Float32Array([
                transform.position[0] + rigidBody.velocity[0] * delta,
                transform.position[1] + rigidBody.velocity[1] * delta,
                transform.position[2] + rigidBody.velocity[2] * delta,
            ]),
        );

        engine.ecs.setComponentValue(
            engine.entities[entityId][RigidbodyComponent.id],
            RigidbodyComponent,
            "velocity",
            new Float32Array([
                rigidBody.velocity[0],
                rigidBody.velocity[1] - .0981 * delta, // Gravity effect
                rigidBody.velocity[2],
            ]),
        );
        
    }
}