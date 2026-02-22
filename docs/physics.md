# Rapier Physics Integration

This document describes the Rapier physics integration in the Opulence Engine.

## Overview

The physics system is built on top of [Rapier](https://rapier.rs/), a fast and cross-platform physics engine. It provides rigid body dynamics, collision detection, and various collider shapes.

## Components

### RigidbodyComponent

The `RigidbodyComponent` defines the physical properties of an entity:

```typescript
const rigidbody = RigidbodyComponent.to(entityId);
rigidbody.mass = 1.0;                    // Mass in kg
rigidbody.isStatic = false;              // Static vs dynamic
rigidbody.linearVelocity = [0, 0, 0];    // Initial velocity
rigidbody.angularVelocity = [0, 0, 0];   // Initial angular velocity
rigidbody.linearDamping = 0.1;           // Velocity damping
rigidbody.angularDamping = 0.1;          // Angular velocity damping
rigidbody.lockRotation = false;          // Lock all rotations
rigidbody.lockTranslation = false;       // Lock all translations
rigidbody.useGravity = true;             // Affected by gravity
rigidbody.gravityScale = 1.0;            // Gravity scale multiplier
rigidbody.canSleep = true;               // Can go to sleep for performance
rigidbody.friction = 0.5;                // Default friction
rigidbody.restitution = 0.2;             // Default bounciness
```

### ColliderComponent

The `ColliderComponent` defines the collision shape:

```typescript
const collider = ColliderComponent.to(entityId);
collider.type = ColliderType.Box;        // Shape type
collider.size = [1, 1, 1];               // Box dimensions
collider.radius = 0.5;                   // Sphere/capsule/cylinder radius
collider.height = 2.0;                   // Capsule/cylinder/cone height
collider.offset = [0, 0, 0];             // Local position offset
collider.friction = 0.5;                 // Surface friction
collider.restitution = 0.2;              // Bounciness (0-1)
collider.density = 1.0;                  // Material density
collider.isSensor = false;               // Trigger/sensor mode
collider.collisionLayer = 1;             // Collision layer
collider.collisionMask = 0xFFFFFFFF;     // What layers this collides with
```

#### Collider Types

- **Box**: Rectangular box collider
- **Sphere**: Spherical collider
- **Capsule**: Pill-shaped collider (sphere + cylinder)
- **Cylinder**: Cylindrical collider
- **Cone**: Cone-shaped collider
- **Trimesh**: Precise mesh collider (static only)
- **ConvexHull**: Convex hull of mesh (dynamic)

## Physics System

The `PhysicsSystem` handles the physics simulation:

```typescript
import PhysicsSystem from "./ecs/systems/physics";

// The system automatically initializes Rapier and manages:
// - Fixed timestep simulation (60Hz)
// - Transform synchronization
// - Entity lifecycle management
```

## Physics Utilities

The `PhysicsUtils` class provides convenient methods for physics interactions:

### Force and Impulse

```typescript
import { PhysicsUtils } from "./ecs/physics/physicsUtils";

// Apply force over time
PhysicsUtils.applyForce(entityId, vec3.create(0, 100, 0));

// Apply impulse (instant velocity change)
PhysicsUtils.applyImpulse(entityId, vec3.create(0, 10, 0));

// Apply force/impulse at specific world point
PhysicsUtils.applyForce(entityId, force, worldPoint);
```

### Velocity Control

```typescript
// Set linear velocity
PhysicsUtils.setVelocity(entityId, vec3.create(5, 0, 0));

// Get current velocity
const velocity = PhysicsUtils.getVelocity(entityId);

// Set angular velocity
PhysicsUtils.setAngularVelocity(entityId, vec3.create(0, 1, 0));

// Get angular velocity
const angularVel = PhysicsUtils.getAngularVelocity(entityId);
```

### Raycasting

```typescript
// Cast a ray through the physics world
const hit = PhysicsUtils.raycast(
    vec3.create(0, 10, 0),  // Origin
    vec3.create(0, -1, 0),  // Direction
    100                     // Max distance
);

if (hit) {
    console.log("Hit point:", hit.point);
    console.log("Hit normal:", hit.normal);
    console.log("Distance:", hit.distance);
}
```

### Entity Creation Helpers

```typescript
// Create physics entities quickly
const box = PhysicsUtils.createBoxEntity(
    engine, 
    vec3.create(0, 5, 0),    // Position
    vec3.create(1, 1, 1),    // Size
    false,                   // Not static
    2.0                      // Mass
);

const sphere = PhysicsUtils.createSphereEntity(
    engine,
    vec3.create(5, 5, 0),    // Position
    0.5,                     // Radius
    false,                   // Not static
    1.0                      // Mass
);

const capsule = PhysicsUtils.createCapsuleEntity(
    engine,
    vec3.create(-5, 5, 0),   // Position
    0.5,                     // Radius
    2.0,                     // Height
    false,                   // Not static
    1.5                      // Mass
);
```

### World Settings

```typescript
// Change gravity
PhysicsUtils.setGravity(vec3.create(0, -1.6, 0)); // Moon gravity
```

## Usage Example

Here's a complete example of setting up physics entities:

```typescript
import { Engine } from "./engine";
import { PhysicsUtils } from "./ecs/physics/physicsUtils";
import PhysicsSystem from "./ecs/systems/physics";

// Initialize engine with physics system
const engine = new Engine();
const physicsSystem = new PhysicsSystem();
engine.addSystem(physicsSystem);

// Create a ground plane
const ground = engine.createEntity();
const groundTransform = TransformComponent.to(ground);
const groundRb = RigidbodyComponent.to(ground);
const groundCollider = ColliderComponent.to(ground);

vec3.set(0, -1, 0, groundTransform.position);
groundRb.isStatic = true;
groundCollider.type = ColliderType.Box;
vec3.set(10, 0.1, 10, groundCollider.size);

// Create falling objects
const box = PhysicsUtils.createBoxEntity(
    engine,
    vec3.create(0, 5, 0),
    vec3.create(1, 1, 1),
    false,
    1
);

// Apply some forces
setTimeout(() => {
    PhysicsUtils.applyImpulse(box, vec3.create(5, 10, 0));
}, 1000);
```

## Best Practices

### Performance

1. **Use static bodies** for non-moving geometry (ground, walls, etc.)
2. **Prefer simple shapes** (box, sphere, capsule) for dynamic objects
3. **Use trimesh only for static** complex geometry
4. **Enable sleeping** for objects that don't move much
5. **Set appropriate damping** to prevent unrealistic perpetual motion

### Collision Detection

1. **Use collision layers** to control what objects interact
2. **Use sensors/triggers** for areas that detect but don't collide
3. **Consider convex decomposition** for complex dynamic shapes
4. **Test collision bounds** in your specific use case

### Stability

1. **Avoid very small or very large** masses and scales
2. **Use reasonable time steps** (default 60Hz is usually good)
3. **Set minimum sizes** for colliders (avoid zero or near-zero dimensions)
4. **Monitor simulation health** via console logs

### Common Issues

1. **Objects falling through ground**: Check that ground is thick enough and positioned correctly
2. **Jittery movement**: Reduce time step or increase damping
3. **Unrealistic behavior**: Verify mass, friction, and restitution values
4. **Performance issues**: Use fewer dynamic bodies, enable sleeping, optimize collision shapes

## Integration with Engine

The physics system integrates with the ECS architecture:

- **Entities** with `RigidbodyComponent` and `TransformComponent` are automatically simulated
- **Transform changes** are synchronized bidirectionally
- **Fixed timestep** ensures consistent physics regardless of frame rate
- **Component lifecycle** is automatically managed

The system respects the engine's entity lifecycle and will clean up physics bodies when entities are destroyed.