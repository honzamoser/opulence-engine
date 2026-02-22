import { vec3, Vec3 } from "wgpu-matrix";
import { Engine } from "../../engine";
import { RigidbodyComponent, ColliderComponent, TransformComponent } from "@generated";
import PhysicsSystem from "../systems/physics";

/**
 * Physics utility functions for easy physics operations
 */
export class PhysicsUtils {
    private static physicsSystem: PhysicsSystem | null = null;

    static setPhysicsSystem(system: PhysicsSystem): void {
        PhysicsUtils.physicsSystem = system;
    }

    /**
     * Apply force to a rigidbody entity
     */
    static applyForce(entityId: number, force: Vec3, worldPoint?: Vec3): void {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return;
        }

        const forceObj = { x: force[0], y: force[1], z: force[2] };
        const pointObj = worldPoint ? { x: worldPoint[0], y: worldPoint[1], z: worldPoint[2] } : undefined;
        
        PhysicsUtils.physicsSystem.applyForce(entityId, forceObj, pointObj);
    }

    /**
     * Apply impulse to a rigidbody entity
     */
    static applyImpulse(entityId: number, impulse: Vec3, worldPoint?: Vec3): void {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return;
        }

        const impulseObj = { x: impulse[0], y: impulse[1], z: impulse[2] };
        const pointObj = worldPoint ? { x: worldPoint[0], y: worldPoint[1], z: worldPoint[2] } : undefined;
        
        PhysicsUtils.physicsSystem.applyImpulse(entityId, impulseObj, pointObj);
    }

    /**
     * Set velocity of a rigidbody entity
     */
    static setVelocity(entityId: number, velocity: Vec3): void {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return;
        }

        PhysicsUtils.physicsSystem.setVelocity(entityId, { x: velocity[0], y: velocity[1], z: velocity[2] });
    }

    /**
     * Get velocity of a rigidbody entity
     */
    static getVelocity(entityId: number): Vec3 | null {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return null;
        }

        const vel = PhysicsUtils.physicsSystem.getVelocity(entityId);
        return vel ? vec3.create(vel.x, vel.y, vel.z) : null;
    }

    /**
     * Set angular velocity of a rigidbody entity
     */
    static setAngularVelocity(entityId: number, angularVel: Vec3): void {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return;
        }

        PhysicsUtils.physicsSystem.setAngularVelocity(entityId, { x: angularVel[0], y: angularVel[1], z: angularVel[2] });
    }

    /**
     * Get angular velocity of a rigidbody entity
     */
    static getAngularVelocity(entityId: number): Vec3 | null {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return null;
        }

        const angVel = PhysicsUtils.physicsSystem.getAngularVelocity(entityId);
        return angVel ? vec3.create(angVel.x, angVel.y, angVel.z) : null;
    }

    /**
     * Perform a raycast in the physics world
     */
    static raycast(origin: Vec3, direction: Vec3, maxDistance: number = 1000): RaycastHit | null {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return null;
        }

        const originObj = { x: origin[0], y: origin[1], z: origin[2] };
        const dirObj = { x: direction[0], y: direction[1], z: direction[2] };

        const hit = PhysicsUtils.physicsSystem.raycast(originObj, dirObj, maxDistance);
        
        if (hit) {
            return {
                point: vec3.create(hit.point.x, hit.point.y, hit.point.z),
                normal: vec3.create(hit.normal.x, hit.normal.y, hit.normal.z),
                distance: hit.distance,
                entityId: -1 // TODO: Map collider to entity ID
            };
        }

        return null;
    }

    /**
     * Set gravity for the physics world
     */
    static setGravity(gravity: Vec3): void {
        if (!PhysicsUtils.physicsSystem) {
            console.error("[PhysicsUtils] Physics system not initialized");
            return;
        }

        PhysicsUtils.physicsSystem.setGravity({ x: gravity[0], y: gravity[1], z: gravity[2] });
    }

    /**
     * Create a box collider entity
     */
    static createBoxEntity(engine: Engine, position: Vec3, size: Vec3, isStatic: boolean = false, mass: number = 1): number {
        const entityId = engine.createEntity();
        
        // Add transform component
        const transform = TransformComponent.to(entityId);
        vec3.copy(position, transform.position);
        
        // Add rigidbody component
        const rigidbody = RigidbodyComponent.to(entityId);
        rigidbody.isStatic = isStatic;
        rigidbody.mass = mass;
        
        // Add collider component
        const collider = ColliderComponent.to(entityId);
        collider.type = 'box';
        vec3.copy(size, collider.size);
        
        return entityId;
    }

    /**
     * Create a sphere collider entity
     */
    static createSphereEntity(engine: Engine, position: Vec3, radius: number, isStatic: boolean = false, mass: number = 1): number {
        const entityId = engine.createEntity();
        
        // Add transform component
        const transform = TransformComponent.to(entityId);
        vec3.copy(position, transform.position);
        
        // Add rigidbody component
        const rigidbody = RigidbodyComponent.to(entityId);
        rigidbody.isStatic = isStatic;
        rigidbody.mass = mass;
        
        // Add collider component
        const collider = ColliderComponent.to(entityId);
        collider.type = 'sphere';
        collider.radius = radius;
        
        return entityId;
    }

    /**
     * Create a capsule collider entity
     */
    static createCapsuleEntity(engine: Engine, position: Vec3, radius: number, height: number, isStatic: boolean = false, mass: number = 1): number {
        const entityId = engine.createEntity();
        
        // Add transform component
        const transform = TransformComponent.to(entityId);
        vec3.copy(position, transform.position);
        
        // Add rigidbody component
        const rigidbody = RigidbodyComponent.to(entityId);
        rigidbody.isStatic = isStatic;
        rigidbody.mass = mass;
        
        // Add collider component
        const collider = ColliderComponent.to(entityId);
        collider.type = 'capsule';
        collider.radius = radius;
        collider.height = height;
        
        return entityId;
    }
}

export interface RaycastHit {
    point: Vec3;
    normal: Vec3;
    distance: number;
    entityId: number;
}