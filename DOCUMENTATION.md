# Opulence Engine — Technical Documentation

> **Version:** pre-release  
> **Language:** TypeScript 5 · WGSL  
> **Renderer:** Helios2 (WebGPU)  
> **Physics:** cannon-es  

---

## Table of Contents

**Part I — Theoretical Foundation**

1. [Introduction](#1-introduction)  
2. [High-Level Architecture](#2-high-level-architecture)  
3. [Entity-Component-System (ECS)](#3-entity-component-system-ecs)  
4. [The Component Compilation Pipeline](#4-the-component-compilation-pipeline)  
5. [Memory Management](#5-memory-management)  
6. [The Helios2 WebGPU Renderer](#6-the-helios2-webgpu-renderer)  
7. [Physics Integration](#7-physics-integration)  

**Part II — Practical Guide**

8. [Getting Started](#8-getting-started)  
9. [Entities and Components](#9-entities-and-components)  
10. [Writing Systems](#10-writing-systems)  
11. [Rendering in Practice](#11-rendering-in-practice)  
12. [Physics in Practice](#12-physics-in-practice)  
13. [Input Handling](#13-input-handling)  
14. [Complete Example Scene](#14-complete-example-scene)  

---

# Part I — Theoretical Foundation

---

## 1. Introduction

**Opulence** is an open-source, TypeScript-based 3-D game engine for the web. Its two core design goals are:

- **Performance** — data-oriented storage, GPU-driven rendering, and zero-copy component access.
- **Developer experience** — a clean, type-safe API backed by a code-generation step that eliminates boilerplate.

The engine is structured around three large subsystems that work in concert every frame:

| Subsystem | Role |
|-----------|------|
| **ECS** (Opulence ECS) | Manages all game state as typed component data attached to entities |
| **Renderer** (Helios2) | Draws every visible object on the GPU via WebGPU |
| **Physics** (cannon-es) | Simulates rigid bodies and synchronises the result back to ECS |

The long-term vision is to port the engine to WebAssembly once the TypeScript MVP is complete, gaining another performance tier with no API changes required by the game code.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│  ┌──────────┐    ┌──────────────────────────────────────┐  │
│  │  Game    │    │              Engine                  │  │
│  │  Code    │───▶│  createEntity()  addComponent()      │  │
│  │          │    │  query()         update()            │  │
│  └──────────┘    └───────┬──────────────────────────────┘  │
│                          │                                  │
│          ┌───────────────┼───────────────┐                  │
│          ▼               ▼               ▼                  │
│  ┌──────────────┐ ┌────────────┐ ┌────────────────┐        │
│  │  ECS + Memory│ │  Helios2   │ │  PhysicsSystem │        │
│  │  (ecs.ts)    │ │  Renderer  │ │  (cannon-es)   │        │
│  │  Archetypes  │ │  WebGPU    │ │                │        │
│  └──────────────┘ └────────────┘ └────────────────┘        │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ requestAnimationFrame loop  (lifecycle.ts)         │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

The `Engine` class is the façade that ties everything together. Game code interacts exclusively with the `Engine` API; it never touches allocators, GPU buffers, or physics worlds directly.

### Per-frame execution order

Each frame the following sequence runs inside `Engine.update(delta)`:

1. Every registered `System.update(entities, delta, engine)` is called in registration order.
2. Every registered `System.afterUpdate(engine)` is called to perform cleanup.

The physics system advances the simulation, the render system computes transform matrices and triggers a GPU render pass — all within that single update sequence.

---

## 3. Entity-Component-System (ECS)

### 3.1 Concepts

ECS separates *what exists* (entities), *what data describes it* (components), and *what logic transforms it* (systems):

- **Entity** — a plain integer index. Entities carry no data themselves; they are only identifiers that component instances are attached to.
- **Component** — a typed data record. A component class describes a fixed-size (hot) or variable-size (cold) block of memory. It holds no logic.
- **System** — a class with an `update` hook called once per frame. A system declares which components it cares about by querying the engine, then reads and writes component data.

This separation produces clean, reusable, cache-friendly code.

### 3.2 Archetype-Based Entity Storage

Naïve ECS implementations scan all entities every frame to find those that match a query. The Opulence ECS avoids this by using **archetypes**.

An *archetype* is the set of all entities that have exactly the same combination of components. Internally, archetypes are identified by a bitmask: each component type is assigned a unique integer id, and the archetype's mask is built by setting the bit at position `componentId` for each component the entity owns.

```
Entity 0: [Transform, Mesh]        → bitmask 0b0011
Entity 1: [Transform, RigidBody]   → bitmask 0b0101
Entity 2: [Transform, Mesh, RigidBody] → bitmask 0b0111
```

A query for `[Transform, Mesh]` only needs to inspect archetypes whose mask has both bits set — in the example above just entity 0 and entity 2. The check is a single bitwise `AND`:

```
(archetype.mask & queryMask) === queryMask   →  match
```

**ArchetypeBasket** (in `engine.ts`) maintains:

- `archetypes: Map<string, Archetype>` — maps the serialised mask to the archetype object.
- `entityArchetype[entityId]` — direct pointer from entity id to its current archetype.
- `entityRow[entityId]` — the entity's row index inside that archetype's `entities` array.

When a component is added to an entity, the entity is *migrated* from its old archetype to a new one in O(1) using a **swap-and-pop** removal: the last entity in the old archetype's array fills the vacated slot, and its `entityRow` lookup is updated.

### 3.3 Component Bitmasks

Because there can be more than 32 component types, the bitmask is a `Uint32Array` wide enough to hold one bit per component (`Math.ceil(componentCount / 32)` words). The `blockIndex` and `bitIndex` for a given component id are:

```typescript
const blockIndex = Math.floor(componentId / 32);
const bitIndex   = componentId % 32;
mask[blockIndex] |= (1 << bitIndex);
```

This makes every query operation a simple loop over a small integer array, independent of the total number of entities.

### 3.4 Hot and Cold Component Storage

All instances of a given component type share a single contiguous `ArrayBuffer`. The layout is **struct-of-arrays**: every field of the component occupies a fixed-width slice at a known byte offset, calculated at compile time (the *stride*).

| Storage kind | Decoration | Characteristics |
|---|---|---|
| **Hot** | `@hot.*` | Fixed maximum size, lives in the main component `ArrayBuffer`, direct typed-array access |
| **Cold** | `@cold.*` / `@heap.*` | Unbounded size, lives in the `Allocator` heap, accessed via a pointer stored in the hot region |

Examples of hot fields:

```typescript
@hot.float32       speed: number;          // 4 bytes
@hot.float32Array(3) position: Vec3;       // 12 bytes
@hot.string(32)    tag: string;            // 32 bytes (padded)
@hot.boolean       isActive: boolean;      // 1 byte
```

Examples of cold fields (pointer stored as `int32` in hot region, data in heap):

```typescript
@cold.string       description: string;   // unlimited
@cold.float32Array vertices: Float32Array; // unlimited
```

---

## 4. The Component Compilation Pipeline

Writing raw accessor code for every component by hand would be error-prone. Opulence ships a Vite plugin (`plugin/opulence-compiler.ts`) that generates it automatically at build time.

```
┌─────────────────────────────┐
│  Developer writes:          │
│  class TransformComponent   │
│    @hot.float32Array(3)      │
│    position: Vec3;           │
│    @hot.float32Array(3)      │
│    rotation: Vec3;           │
│    @hot.float32Array(3)      │
│    scale: Vec3;              │
│    @hot.float32Array(16)     │
│    matrix: Mat4;             │
└─────────────┬───────────────┘
              │  ts-morph AST parse
              ▼
┌─────────────────────────────┐
│  Compiler calculates:       │
│  stride = 3+3+3+16 = 25     │
│         floats = 100 bytes  │
│  offsets for each field     │
└─────────────┬───────────────┘
              │  code generation
              ▼
┌─────────────────────────────┐
│  Generated accessor class:  │
│  static stride = 100        │
│  static IDENTIFIER = 0      │
│  to(id): this               │
│  get positionX(): number    │
│  set positionX(v: number)   │
│  cpy_position(out: Vec3)    │
│  ...                        │
└─────────────────────────────┘
```

The generated code is written to `generated/` and imported engine-wide via the `@generated` TypeScript path alias. Because the entire layout is known statically, the accessors produced by the compiler are inlineable by the JavaScript engine — no dynamic property look-up, no GC pressure from temporary objects.

---

## 5. Memory Management

### 5.1 Component Buffers

The `ECS` class pre-allocates one `ArrayBuffer` per component type sized for 100 instances (`STRIDE * 100`). If a game spawns more entities it can extend the buffer; a future defragmentation pass is planned.

```typescript
// ecs.ts (simplified)
for (const componentType of generatedComponents) {
    this.componentMemory[componentType.IDENTIFIER] =
        new ArrayBuffer(componentType.STRIDE * 100);
    componentType.initialize(this.componentMemory[...], this.coldAllocator);
}
```

### 5.2 The Heap Allocator

Cold (dynamic-size) data lives in a separate `Allocator` instance (`ECS.coldAllocator`). The allocator manages a single `ArrayBuffer` and exposes a simple linear-bump strategy:

- `alloc(size)` — advance a cursor and return the old position as a pointer.
- `resize_alloc(ptr, size, newSize)` — copy to new position and free old slot.
- `free(ptr, size)` — store pointer in a size-keyed free-bucket for future reuse.
- `resize()` — double the underlying buffer and copy, triggered automatically when capacity is exceeded.

The allocator exposes multiple typed views (`Uint8Array`, `Float32Array`, `Int32Array`, `Uint32Array`) over the same memory so the same bytes can be read as different numeric types without extra copies.

---

## 6. The Helios2 WebGPU Renderer

### 6.1 WebGPU Overview

WebGPU is the successor to WebGL, giving web applications low-level GPU access comparable to Vulkan/Metal/D3D12. Key differences relevant to Opulence:

- **Command encoders** — GPU work is recorded into a command buffer, not issued as immediate calls.
- **Compute shaders** — general-purpose GPU programs that can read/write storage buffers before a render pass begins.
- **Indirect drawing** — the draw call parameters (instance count, first index, etc.) live in a GPU buffer, so the CPU never needs to know how many instances are visible.

### 6.2 Buffer Layout

`Helios2Renderer` maintains a fixed set of GPU buffers:

| Buffer | Content | Stride |
|---|---|---|
| `vertex` | Interleaved XYZ positions | 12 bytes |
| `index` | Triangle indices (uint32) | 4 bytes |
| `normal` | Interleaved XYZ normals | 12 bytes |
| `instance` | Mat4 model matrix + Vec4 colour + commandId float | 96 bytes |
| `indirect` | One `IndirectCommand` per draw call (5 × uint32) | 20 bytes |
| `uniform` | ViewProj matrix, 6 frustum planes, time, instance count | variable |
| `visible` | Indices of instances that passed culling | 4 bytes each |

All geometry from every mesh loaded into the scene is packed into the same vertex and index buffers; each mesh's position is tracked by a metadata array (`meshes.buffer`).

### 6.3 Three-Phase Render Loop

Every frame the renderer executes three GPU passes:

#### Phase 1 — Reset (compute)

A compute shader (`reset_main`) zeroes the `instanceCount` field of every `IndirectCommand`. This field is declared `atomic<u32>` so concurrent writes from Phase 2 are safe.

```wgsl
@compute @workgroup_size(64)
fn reset_main(@builtin(global_invocation_id) id : vec3<u32>) {
    let index = id.x;
    if (index >= arrayLength(&commands)) { return; }
    atomicStore(&commands[index].instanceCount, 0u);
}
```

#### Phase 2 — Frustum Culling (compute)

`cull_main` runs one thread per instance. Each thread:

1. Reads the instance's model matrix and extracts the world-space translation (column 3).
2. Calls `checkFrustrum` — tests the bounding sphere centre against six frustum planes.
3. If visible, atomically increments the mesh's `instanceCount` and appends the instance index to `visibleInstances[]`.

```wgsl
fn checkFrustrum(center: vec3<f32>, radius: f32,
                 planes: array<vec4<f32>, 6>) -> bool {
    for (var i = 0; i < 6; i++) {
        let d = dot(planes[i].xyz, center) + planes[i].w;
        if (d < -radius) { return false; }
    }
    return true;
}
```

Only visible instances are written to the `visibleInstances` buffer, so the render pass never touches culled geometry.

#### Phase 3 — Render pass

A single `multiDrawIndexedIndirect` call issues all draw commands at once. The GPU reads `instanceCount` for each command from the indirect buffer (populated by Phase 2) and skips commands where it is zero. The vertex shader indexes into `visibleInstances[]` to fetch the correct model matrix:

```wgsl
@vertex
fn vs_main(@builtin(instance_index) instanceId : u32, ...) -> VertexOutput {
    let realInstanceId = visibleInstances[instanceId];
    let instance = instanceBuffer[realInstanceId];
    // ...
}
```

The fragment shader applies a basic Phong model with ambient and point-light components.

### 6.4 Frustum Plane Extraction

The six clip planes are extracted from the combined view-projection matrix every frame on the CPU and uploaded to the uniform buffer. The standard Gribb–Hartmann method is used: each plane is a linear combination of two rows of the view-projection matrix. This keeps the GPU shader arithmetic minimal.

### 6.5 Mesh Upload and Instantiation

Meshes are uploaded once via `uploadMesh(vertices, indices, normals)`. The renderer appends the data to the global GPU buffers and records the byte offsets in a CPU-side metadata array. Calling `_instantiate(meshIndex, matrix, color)` allocates a slot in the instance buffer and writes a corresponding `IndirectCommand`.

---

## 7. Physics Integration

The physics subsystem is implemented as a standard ECS system (`PhysicsSystem`) on top of **cannon-es**, a modern ES-module port of Cannon.js. This keeps the physics engine completely decoupled from the renderer.

### 7.1 Lifecycle

`PhysicsSystem.start()` creates a `CANNON.World` with gravity `(0, -9.82, 0)`.

`PhysicsSystem.update()`:
1. Queries all entities that have `RigidbodyComponent`, `TransformComponent`, and `ColliderComponent`.
2. Advances the simulation by one fixed step (`world.fixedStep()`).
3. For each entity:
   - If `bodyId === -1` (first frame), creates a Cannon body with the appropriate shape and adds it to the world.
   - Otherwise, reads back the position and quaternion from the Cannon body and writes them into the entity's `TransformComponent`.

### 7.2 Supported Collision Shapes

| `shapeType` | Shape | Notes |
|---|---|---|
| `0` | Box | Planned |
| `1` | Plane | Infinite flat surface, auto-rotated 90° to face up |
| `2` | Convex polyhedron | Built from `ColliderComponent.vertices` and `indices` with duplicate-vertex filtering |

For convex polyhedra, a deduplication pass runs on the vertex array before passing it to Cannon. Duplicate vertices (floating-point positions identical to within four decimal places) are merged and the index buffer is remapped, which Cannon requires for correct geometry processing.

---

# Part II — Practical Guide

---

## 8. Getting Started

### 8.1 Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 18 + |
| pnpm | 8 + |
| A browser with WebGPU support | Chrome 113+ with `--enable-unsafe-webgpu` flag, or Chrome 121+ stable |

### 8.2 Installation

```bash
# Clone the repository
git clone https://github.com/honzamoser/opulence-engine.git
cd opulence-engine

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The development server is Vite. Open `http://localhost:5173` in a WebGPU-capable browser.

### 8.3 Project Layout

```
opulence-engine/
├── src/               ← Engine source code (do not edit for game logic)
│   ├── engine.ts      ← Main Engine class
│   ├── lifecycle.ts   ← requestAnimationFrame game loop
│   ├── input.ts       ← InputHandler
│   ├── ecs/           ← ECS, components, systems
│   └── renderer/      ← Helios2 WebGPU renderer
├── game_src/          ← Your game code lives here
│   ├── render_test.ts ← Entry point example
│   ├── components/    ← Custom component definitions
│   └── systems/       ← Custom system definitions
├── generated/         ← Auto-generated component accessors (do not edit)
├── compiler/          ← Component code-generation tool
└── plugin/            ← Vite plugin for automatic code generation
```

---

## 9. Entities and Components

### 9.1 Defining a Custom Component

Create a file that ends in `.component.ts` inside `game_src/components/` (or any directory scanned by the compiler). Extend `Component` and annotate fields with `@hot.*` or `@cold.*` decorators.

```typescript
// game_src/components/health.component.ts
import { Component } from "../../src/ecs/component";
import { constructor, hot } from "../../src/ecs/component-gen";

export default class HealthComponent extends Component {
  @constructor(0)
  @hot.float32
  current: number = 100;

  @constructor(1)
  @hot.float32
  maximum: number = 100;

  @hot.boolean
  isDead: boolean = false;
}
```

The compiler generates accessor methods (`getCurrent`, `setCurrent`, `getMaximum`, …) in `generated/`. After restarting the dev server, `HealthComponent` is importable from `@generated`.

### 9.2 Built-in Components

| Component | Key Fields | Purpose |
|---|---|---|
| `TransformComponent` | `position`, `rotation`, `scale`, `matrix` | World-space placement |
| `MeshComponent` | `meshId`, `rendererdInstasnceId` | Links entity to a rendered mesh |
| `RigidbodyComponent` | `mass`, `isStatic`, `bodyId` | Rigid body physics |
| `ColliderComponent` | `shapeType`, `vertices`, `indices`, `size` | Collision geometry |

### 9.3 Creating Entities and Adding Components

```typescript
import { Engine } from "../src/engine";
import { TransformComponent, MeshComponent } from "@generated";

// Create a blank entity
const entity = engine.createEntity();

// Add a TransformComponent (position, rotation, scale are constructor args)
engine.addComponent(entity, TransformComponent, {
  position: new Float32Array([0, 1, 0]),
  rotation: new Float32Array([0, 0, 0]),
  scale:    new Float32Array([1, 1, 1]),
});

// Add a MeshComponent
engine.addComponent(entity, MeshComponent, {
  meshId: uploadedMeshId,
});
```

`addComponent` allocates a slot in the component's buffer, records the component instance id in `engine.entities[entityId]`, and migrates the entity to the correct archetype.

### 9.4 Reading and Writing Component Data

After adding a component, retrieve a typed accessor with the generated `to()` static method:

```typescript
const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];
const transform   = TransformComponent.to(transformId);

// Read a scalar field
const y = transform.positionY;

// Write a scalar field
transform.positionX = 5.0;

// Copy a vector field into a pre-allocated array (avoids allocation)
const pos = new Float32Array(3);
transform.cpy_position(pos);
```

### 9.5 Querying Entities

```typescript
// Returns the ids of all entities that have BOTH components
const entities = engine.query(MeshComponent, TransformComponent);

for (const entityId of entities) {
  const tId = engine.entities[entityId][TransformComponent.IDENTIFIER];
  const t   = TransformComponent.to(tId);
  console.log(t.positionX, t.positionY, t.positionZ);
}
```

---

## 10. Writing Systems

### 10.1 The System Base Class

```typescript
// src/ecs/system.ts
export class System {
  start?(engine: Engine): Promise<void> | void;
  update?(entities: number[][], delta: number, engine: Engine): void;
  afterUpdate?(engine: Engine): void;
}
```

All three methods are optional. `start` is called once before the first frame. `update` is called every frame with the full entity array and a `delta` value (frames-per-millisecond, i.e. `1 / elapsedMs`). `afterUpdate` runs after all systems have updated.

### 10.2 Writing a Custom System

```typescript
// game_src/systems/spin.ts
import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { TransformComponent } from "@generated";

export class SpinSystem extends System {
  override update(_entities: number[][], delta: number, engine: Engine) {
    const targets = engine.query(TransformComponent);

    for (const entityId of targets) {
      const tId      = engine.entities[entityId][TransformComponent.IDENTIFIER];
      const transform = TransformComponent.to(tId);

      // delta is 1/ms; multiply by 1000 to get seconds
      transform.rotationY += 0.001 * (1 / delta) * (Math.PI / 180) * 45;
    }
  }
}
```

Register the system before calling `engine.start()`:

```typescript
engine.systems.push(new SpinSystem());
```

### 10.3 Built-in Systems

#### RenderSystem

Queries every entity with `MeshComponent` and `TransformComponent`. On the first frame an entity is seen, it is *instantiated* in the renderer (a slot is allocated in the GPU instance buffer). Every subsequent frame the TRS (Translation-Rotation-Scale) matrix is recomputed and written to the GPU.

```typescript
// Register with the renderer instance
engine.systems.push(new RenderSystem(renderer));
```

`RenderSystem` also updates the renderer's camera position and rotation from its own `cameraPosition` and `cameraRotation` vectors, which the game can freely modify.

#### PhysicsSystem

Queries entities with `RigidbodyComponent`, `TransformComponent`, and `ColliderComponent`. Manages the Cannon.js world and synchronises simulation output back to `TransformComponent` each frame.

```typescript
engine.systems.push(new PhysicsSystem());
```

---

## 11. Rendering in Practice

### 11.1 Setting Up the Renderer

```typescript
import { Engine }          from "../src/engine";
import { Helios2Renderer } from "../src/renderer/renderer";

const canvas   = document.getElementById("main") as HTMLCanvasElement;
const renderer = new Helios2Renderer(canvas);
const engine   = new Engine(canvas);

engine.renderer = renderer;

await engine.load();
await renderer.initialize();  // requests GPU adapter, creates pipelines, allocates buffers

engine.systems.push(new RenderSystem(renderer));
engine.start();
```

`renderer.initialize()` must complete before any mesh is uploaded or entities are created that reference meshes.

### 11.2 Uploading a Mesh Manually

```typescript
const vertices = new Float32Array([
  // x,   y,   z
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,
   0.0,  0.5,  0.0,
]);
const indices = new Uint32Array([0, 1, 2]);
const normals = new Float32Array([
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
   0.0,  0.0,  1.0,
]);

const meshId = renderer.uploadMesh(vertices, indices, normals);
```

### 11.3 Loading a GLTF/GLB Model

```typescript
import { loadglb } from "../src/files/gltf-loader";

const instances = await loadglb("resources/scene.glb", { preserveTransforms: true });

for (const inst of instances) {
  const meshId = renderer.uploadMesh(
    inst.mesh.vertices,
    inst.mesh.indices,
    inst.mesh.normals,
  );

  const entity = engine.createEntity();
  engine.addComponent(entity, TransformComponent, {
    position: new Float32Array(inst.position),
    rotation: new Float32Array(inst.rotation),
    scale:    new Float32Array(inst.scale),
  });
  engine.addComponent(entity, MeshComponent, { meshId });
}
```

`loadglb` uses the `@loaders.gl/gltf` library to parse the file and returns an array of `GLTFMeshInstance` objects, each carrying vertex/index/normal data and the original scene-graph transform.

### 11.4 Controlling the Camera

The camera is managed through `RenderSystem`:

```typescript
const renderSystem = new RenderSystem(renderer);

// In your custom system or game loop:
renderSystem.cameraPosition = vec3.create(0, 5, -10);
renderSystem.cameraRotation = vec3.create(0, Math.PI, 0);
```

The renderer builds a look-at view matrix from `cameraPosition` and `cameraRotation` before each frame.

---

## 12. Physics in Practice

### 12.1 Adding a Dynamic Rigid Body

```typescript
import { RigidbodyComponent, ColliderComponent, TransformComponent } from "@generated";

const box = engine.createEntity();

engine.addComponent(box, TransformComponent, {
  position: new Float32Array([0, 10, 0]),
  rotation: new Float32Array([0, 0, 0]),
  scale:    new Float32Array([1, 1, 1]),
});
engine.addComponent(box, RigidbodyComponent, { mass: 1, isStatic: false });
engine.addComponent(box, ColliderComponent, {
  shapeType: 2,        // convex polyhedron
  vertices: boxVerts,  // Float32Array of XYZ positions
  indices:  boxIdx,    // Uint32Array of triangle indices
});
engine.addComponent(box, MeshComponent, { meshId: boxMeshId });
```

On the first frame `PhysicsSystem.update()` sees `bodyId === -1` for this entity and creates a Cannon body. From the second frame on, the body's simulated position and rotation are written back to `TransformComponent`, which `RenderSystem` then uses to update the GPU instance matrix.

### 12.2 Adding a Static Floor

```typescript
const floor = engine.createEntity();

engine.addComponent(floor, TransformComponent, {
  position: new Float32Array([0, 0, 0]),
  rotation: new Float32Array([0, 0, 0]),
  scale:    new Float32Array([1, 1, 1]),
});
engine.addComponent(floor, RigidbodyComponent, { mass: 0, isStatic: true });
engine.addComponent(floor, ColliderComponent, {
  shapeType: 1,  // infinite plane
});
```

---

## 13. Input Handling

`InputHandler` tracks which keyboard keys are currently held down and forwards mouse events through a typed `EventTarget`.

```typescript
import { InputHandler } from "../src/input";

const input = new InputHandler(canvas);

// Inside a system's update():
if (input.isKeyPressed("w")) {
  // move forward
}
if (input.isKeyPressed(" ")) {
  // jump
}

// Subscribe to mouse click events
input.events.addEventListener("contextmenu", (e: CustomEvent) => {
  const mouseEvent = e.detail as MouseEvent;
  console.log("click at", mouseEvent.clientX, mouseEvent.clientY);
});
```

`isKeyPressed` accepts the `KeyboardEvent.key` string values (`"ArrowLeft"`, `"a"`, `" "`, `"Escape"`, etc.).

---

## 14. Complete Example Scene

The following is a minimal but complete game scene that demonstrates every major feature: engine setup, mesh loading, entity creation, a custom system, physics, and input.

```typescript
// game_src/render_test.ts

import { Engine }          from "../src/engine";
import { Helios2Renderer } from "../src/renderer/renderer";
import { InputHandler }    from "../src/input";
import { loadglb }         from "../src/files/gltf-loader";
import { vec3 }            from "wgpu-matrix";

import RenderSystem   from "../src/ecs/systems/render";
import PhysicsSystem  from "../src/ecs/systems/physics";

import {
  TransformComponent,
  MeshComponent,
  RigidbodyComponent,
  ColliderComponent,
} from "@generated";

// ──────────────────────────────────────────────────────────────
// 1. Bootstrap
// ──────────────────────────────────────────────────────────────
const canvas   = document.getElementById("main") as HTMLCanvasElement;
const renderer = new Helios2Renderer(canvas);
const engine   = new Engine(canvas);
const input    = new InputHandler(canvas);

engine.renderer = renderer;

// ──────────────────────────────────────────────────────────────
// 2. Camera control system (inline for brevity)
// ──────────────────────────────────────────────────────────────
import { System } from "../src/ecs/system";

class CameraSystem extends System {
  constructor(
    private renderSystem: RenderSystem,
    private input: InputHandler,
  ) { super(); }

  override update(_e: number[][], delta: number) {
    const speed = 5 * (1 / delta) / 1000;
    if (this.input.isKeyPressed("w"))
      this.renderSystem.cameraPosition[2] -= speed;
    if (this.input.isKeyPressed("s"))
      this.renderSystem.cameraPosition[2] += speed;
    if (this.input.isKeyPressed("a"))
      this.renderSystem.cameraPosition[0] -= speed;
    if (this.input.isKeyPressed("d"))
      this.renderSystem.cameraPosition[0] += speed;
  }
}

// ──────────────────────────────────────────────────────────────
// 3. Load and start
// ──────────────────────────────────────────────────────────────
engine.load().then(async () => {
  await renderer.initialize();

  // Load a GLB model
  const gltfInstances = await loadglb("resources/level.glb");

  for (const inst of gltfInstances) {
    const meshId = renderer.uploadMesh(
      inst.mesh.vertices,
      inst.mesh.indices,
      inst.mesh.normals,
    );

    const entity = engine.createEntity();
    engine.addComponent(entity, TransformComponent, {
      position: new Float32Array(inst.position),
      rotation: new Float32Array(inst.rotation),
      scale:    new Float32Array(inst.scale),
    });
    engine.addComponent(entity, MeshComponent, { meshId });
  }

  // Create a static floor
  const floor = engine.createEntity();
  engine.addComponent(floor, TransformComponent, {
    position: new Float32Array([0, 0, 0]),
    rotation: new Float32Array([0, 0, 0]),
    scale:    new Float32Array([20, 1, 20]),
  });
  engine.addComponent(floor, RigidbodyComponent, { mass: 0, isStatic: true });
  engine.addComponent(floor, ColliderComponent,  { shapeType: 1 });

  // Unit-cube geometry (8 unique vertices, 12 triangles)
  const cubeVerts = new Float32Array([
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5, // back
    -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5, // front
  ]);
  const cubeIdx = new Uint32Array([
    0,1,2, 2,3,0,  4,5,6, 6,7,4,  // back / front
    0,4,7, 7,3,0,  1,5,6, 6,2,1,  // left / right
    3,2,6, 6,7,3,  0,1,5, 5,4,0,  // top / bottom
  ]);
  const cubeNormals = new Float32Array(cubeVerts.length).fill(0); // simplified
  const cubeMeshId = renderer.uploadMesh(cubeVerts, cubeIdx, cubeNormals);

  // Create a falling box
  const box = engine.createEntity();
  engine.addComponent(box, TransformComponent, {
    position: new Float32Array([0, 8, 0]),
    rotation: new Float32Array([0, 0, 0]),
    scale:    new Float32Array([1, 1, 1]),
  });
  engine.addComponent(box, MeshComponent, { meshId: cubeMeshId });
  engine.addComponent(box, RigidbodyComponent, { mass: 1, isStatic: false });
  engine.addComponent(box, ColliderComponent,  {
    shapeType: 2,
    vertices: cubeVerts,
    indices:  cubeIdx,
  });

  // Register systems (order matters)
  const renderSystem = new RenderSystem(renderer);
  engine.systems.push(renderSystem);
  engine.systems.push(new PhysicsSystem());
  engine.systems.push(new CameraSystem(renderSystem, input));

  // Start the game loop
  engine.start();
});
```

When the application runs:

1. The engine initialises all component memory buffers.
2. The renderer acquires the GPU device and compiles the WGSL shaders.
3. The GLB scene is parsed and uploaded to GPU vertex/index buffers.
4. `engine.start()` fires each system's `start()` hook, then enters the `requestAnimationFrame` loop.
5. Every frame: `PhysicsSystem` advances the simulation and updates transform data; `RenderSystem` computes matrices, updates the GPU instance buffer, runs the three-phase GPU render; `CameraSystem` reads input and moves the camera.

---

*This document covers the Opulence Engine as of the pre-release development snapshot. The API is subject to change as the component compiler, editor, and WebAssembly transition are completed. Contributions and issue reports are welcome on the project GitHub.*
