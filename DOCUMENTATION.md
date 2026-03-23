# Opulence Engine — Technical Documentation

---

## Table of Contents

**Part I — Theoretical Foundations**
1. [Introduction & Vision](#1-introduction--vision)
2. [Architecture Overview](#2-architecture-overview)
3. [Entity-Component-System (ECS) Theory](#3-entity-component-system-ecs-theory)
4. [Archetype-Based Query System](#4-archetype-based-query-system)
5. [WebGPU and GPU-Driven Rendering](#5-webgpu-and-gpu-driven-rendering)
6. [Memory Management Strategy](#6-memory-management-strategy)
7. [Physics Integration](#7-physics-integration)
8. [Code Generation Pipeline](#8-code-generation-pipeline)

**Part II — Practical Guide**
9. [Project Setup & Build System](#9-project-setup--build-system)
10. [Core Engine Walkthrough](#10-core-engine-walkthrough)
11. [Components in Practice](#11-components-in-practice)
12. [Systems in Practice](#12-systems-in-practice)
13. [The Helios2 Renderer](#13-the-helios2-renderer)
14. [WGSL Shaders Deep Dive](#14-wgsl-shaders-deep-dive)
15. [Complete Example: Physics Demo](#15-complete-example-physics-demo)

---

# Part I — Theoretical Foundations

---

## 1. Introduction & Vision

**Opulence** is a 3D game engine written in TypeScript that targets modern web browsers using the WebGPU graphics API. It is built around an Entity-Component-System (ECS) architecture with a strong emphasis on runtime performance: memory-efficient component storage, GPU-driven rendering with instancing and frustum culling, and a compile-time code-generation pipeline that eliminates dynamic dispatch overhead.

The engine is structured around two primary systems:

- **Opulence ECS** — the logic and data layer, responsible for managing entities, components, and systems.
- **Helios2** — the rendering backend, responsible for uploading geometry to the GPU, performing frustum culling on the GPU via compute shaders, and issuing GPU-driven draw calls with `multiDrawIndexedIndirect`.

The long-term vision of the project is a future rewrite to WebAssembly for even lower-level performance control, while keeping the developer-facing API in TypeScript so that game logic remains ergonomic to write.

**Technology stack at a glance:**

| Technology | Role |
|---|---|
| TypeScript 5.9 | Engine and game logic language |
| WebGPU | Low-level GPU graphics API |
| WGSL | WebGPU Shading Language for shaders |
| Vite 7 | Development server and bundler |
| wgpu-matrix | Math library (Vec3, Mat4) |
| @dimforge/rapier3d | High-performance 3D physics (available) |
| cannon-es | Current physics backend (simpler API) |
| ts-morph | TypeScript AST parsing for code generation |

---

## 2. Architecture Overview

The engine is organized into three main layers that communicate in a top-down fashion.

```
┌──────────────────────────────────────────────────────┐
│                  Application Layer                   │
│  game_src/*/render_test.ts — Configures and starts   │
│  the engine; registers systems; creates entities     │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│                   Engine Core (src/)                 │
│                                                      │
│  Engine ──── ECS (component memory)                  │
│    │          └── Allocator (cold/dynamic heap)       │
│    │                                                  │
│    ├── ArchetypeBasket (fast entity queries)          │
│    ├── Systems[]  (update / afterUpdate loop)         │
│    ├── PointerManager (dynamic data references)      │
│    └── Helios2Renderer (GPU frontend)                │
└────────────────────────┬─────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────┐
│                   GPU Layer (WebGPU)                  │
│  Vertex / Index / Instance / Uniform / Indirect      │
│  Buffers — Compute shaders (cull, reset) — Render    │
│  pipeline (vs_main / fs_main)                        │
└──────────────────────────────────────────────────────┘
```

**Data flow per frame:**

1. `requestAnimationFrame` triggers the lifecycle loop.
2. `Engine.update()` calls every registered `System.update()`.
3. `RenderSystem` queries entities with `MeshComponent + TransformComponent`, computes model matrices, and calls `Helios2Renderer.render()`.
4. The renderer runs a **reset** compute pass, then a **culling** compute pass, and finally a **render** pass with indirect draw calls.
5. `PhysicsSystem` updates velocities and positions based on simple gravity and collision detection.

---

## 3. Entity-Component-System (ECS) Theory

ECS is an architectural pattern that separates **identity** (entities), **data** (components), and **behaviour** (systems).

### Entities

An entity is nothing more than an integer identifier. It carries no data and no logic of its own. In Opulence:

```typescript
// engine.ts
createEntity(): number {
  return this.entities.push([]) - 1;
}
```

The return value is the array index, so entity IDs start at 0 and increase monotonically. The `entities` array maps each entity ID to a sparse array of component instance IDs, indexed by the component's global `IDENTIFIER`.

### Components

A component is a **pure data bag**. It should contain no methods beyond accessors. The data of all components of a given type is stored in a single contiguous `ArrayBuffer` that is pre-allocated at startup for 10,000 component instances:

```typescript
// ecs.ts
this.componentMemory[componentType.IDENTIFIER] = new ArrayBuffer(
  componentType.STRIDE * ECS.COMPONENT_CAPACITY,
);
```

The per-type buffer is backed by multiple typed views (`Float32Array`, `Uint32Array`, etc.) created by the code-generated component class. Properties are accessed via static getter/setter methods that calculate byte offsets at compile time, resulting in zero-overhead reads and writes.

### Systems

A system encapsulates all **behaviour** for a particular slice of functionality. Each system implements the following optional interface:

```typescript
// system.ts
export class System {
  update?(entities: number[][], delta: number, engine: Engine): void;
  start?(engine: Engine): void;
  afterUpdate?(engine: Engine): void;
}
```

- `start` is called once before the game loop begins.
- `update` is called every frame with the full entity list and a delta-time value.
- `afterUpdate` is called after all systems have run their `update`.

Systems should call `engine.query(ComponentTypeA, ComponentTypeB, ...)` to obtain the set of entity IDs that have all required component types, and then read/write those components directly through the generated static accessors.

---

## 4. Archetype-Based Query System

A naive ECS query iterates every entity and checks whether it possesses all required component types — an O(n) scan. Opulence replaces this with an **archetype graph** that makes queries essentially O(archetypes), which in practice approaches O(1).

### Archetypes

An **archetype** represents a unique combination of component types. Every entity belongs to exactly one archetype, determined by its current set of components. The archetype is identified by a **bitfield mask**: a `Uint32Array` where bit `i` is set if component with `IDENTIFIER = i` is present.

```typescript
class Archetype {
  public mask: Uint32Array;   // Component presence bitmask
  public entities: number[];  // Entity IDs in this archetype
}
```

### Migration

When a component is added to an entity, the entity must **migrate** from its current archetype to a new one whose mask has the additional bit set. Migration involves:

1. Computing the new mask.
2. Hashing the mask to find or create the corresponding `Archetype` object.
3. Removing the entity from the old archetype using a **swap-and-pop** technique (O(1), no array shifts).
4. Appending the entity to the new archetype's entity list.
5. Updating the reverse-lookup tables (`entityArchetype` and `entityRow`).

```typescript
// engine.ts — removeEntityFromArchetype
const indexToRemove = this.entityRow[entityId];
const lastIndex = arch.entities.length - 1;
if (indexToRemove !== lastIndex) {
  const lastEntity = arch.entities[lastIndex];
  arch.entities[indexToRemove] = lastEntity;
  this.entityRow[lastEntity] = indexToRemove; // Update moved entity's row
}
arch.entities.pop();
```

### Querying

Querying for entities with a specific set of components builds a requirement mask and then tests each archetype in the basket. Only archetypes whose masks satisfy the bitfield check contribute their entity lists to the result:

```typescript
// engine.ts — QueryEntities
for (const arch of this.archetypes.values()) {
  if (this.matches(arch.mask, reqMask)) {
    for (let i = 0; i < arch.entities.length; i++) {
      results.push(arch.entities[i]);
    }
  }
}
```

Because the number of distinct archetypes is typically much smaller than the total entity count, this delivers near-constant-time query performance for large worlds.

---

## 5. WebGPU and GPU-Driven Rendering

### WebGPU

WebGPU is the successor to WebGL, exposing a modern low-level GPU API (similar to Vulkan, Metal, and Direct3D 12) in the browser. Key advantages relevant to Opulence:

- **Compute shaders** — general-purpose GPU programs that can run before the render pass.
- **Storage buffers** — large readable/writable GPU-side buffers, used for instance data and indirect commands.
- **Indirect draw calls** — the CPU submits a draw command whose parameters (instance count, first instance, etc.) are stored in a GPU buffer, allowing the GPU to decide what to draw without CPU readback.

### GPU-Driven Rendering Pipeline

Opulence uses the following multi-pass pattern each frame:

**Pass 1 — Reset (Compute)**
A compute shader (`reset_main`) runs with one workgroup per indirect command. It zeroes the `instanceCount` field of every indirect draw command, preparing for the cull pass.

**Pass 2 — Frustum Cull (Compute)**
A second compute shader (`cull_main`) dispatches one thread per instance. Each thread:
1. Reads the instance's model matrix and extracts the world-space translation as the bounding-sphere centre.
2. Tests the sphere against all 6 frustum planes using the signed-distance formula.
3. If visible, atomically increments the `instanceCount` of the corresponding indirect command and writes the instance index into the `visibleInstances` buffer at the correct slot.

**Pass 3 — Render (Vertex + Fragment)**
A single `drawIndexedIndirect` call (one per unique mesh) draws only the visible instances. The vertex shader reads the visible instance list and fetches the model matrix and colour from the instance buffer for each instance index.

### Instancing

A mesh uploaded once to the GPU can be rendered thousands of times with different transforms and colours at negligible extra cost. Opulence supports two instancing modes:

- **Lazy instancing** (`_instantiate`): a single entity is given its own draw slot. The model matrix is updated every frame via `_updateMatrix`.
- **Batch instancing** (`_instantiateBatch`): multiple entities with the same mesh are submitted together in one call. The batch is rebuilt every frame for entities flagged with `batch: true`.

---

## 6. Memory Management Strategy

Opulence distinguishes between two categories of component data:

### Hot Storage

Fields decorated with `@hot.*` are stored in the pre-allocated contiguous `ArrayBuffer` managed by the `ECS` class. Access patterns are predictable and cache-friendly because all instances of a given component type occupy adjacent memory.

Supported hot types include:
- `@hot.float32` — a single 32-bit float (4 bytes)
- `@hot.float32Array(n)` — an array of `n` floats (4×n bytes)
- `@hot.int32` — a signed 32-bit integer (4 bytes)
- `@hot.boolean` — a boolean stored as 1 byte
- `@hot.string(maxSize)` — a fixed-width string padded to `maxSize` bytes

### Cold (Dynamic) Storage

Fields decorated with `@cold.*` (also aliased as `@heap.*`) are allocated in a separate **dynamic heap** managed by the `Allocator` class. This is necessary for data whose size is not known at compile time (variable-length arrays, large strings).

The `Allocator` uses a **bump pointer** strategy: it advances a cursor on each allocation and maintains a **bucketed free list** keyed by byte size for reuse. When the heap is exhausted it doubles in size and copies all data:

```typescript
// allocator.ts
alloc(size: number): number {
  const padding = this.cursor % 4 === 0 ? 0 : 4 - (this.cursor % 4);
  this.cursor += padding;            // Ensure 4-byte alignment
  if (this.cursor + size > this.heap.byteLength) this.resize();
  const ptr = this.cursor;
  this.cursor += size;
  return ptr;
}
```

Callers receive an integer pointer (byte offset into the heap `ArrayBuffer`) and use typed view helpers (`get_mem_vf32`, `get_mem_vu32`, etc.) to access data without unsafe casts.

### Pointer Indirection

For data that lives outside component memory (e.g., GPU-uploaded mesh vertex arrays), the `PointerManager` class maintains an array of `ArrayBuffer` values and returns integer handles (`pointerId`). This allows components to store a reference to variable-sized buffers without embedding them in the fixed-size hot buffer.

---

## 7. Physics Integration

Opulence's physics layer bridges the ECS component model with external physics libraries. The engine currently uses **cannon-es** for its simple JavaScript API, while also shipping bindings to the higher-performance **@dimforge/rapier3d** (Rust/WASM) library for more demanding simulations.

### Component Representation

Physics state is split across two components:

- **RigidbodyComponent** — holds mass, velocity, `isStatic` flag, and a `bodyId` that references the physics engine's internal body handle.
- **ColliderComponent** — holds bounding-box extents, local offset, shape type (`box=0`, `plane=1`, `mesh=2`), and optionally a pointer to raw vertex/index data for mesh colliders.

### Simulation Loop

`PhysicsSystem.update()` queries all entities that have both `RigidbodyComponent` and `TransformComponent`. For each non-static body it:

1. Applies gravitational acceleration: `vy -= 9.81 * dt`
2. Integrates velocity into position: `pos += vel * dt`
3. Detects a simple ground plane at `y = -4` and zeroes the vertical velocity when contact is detected.

Although the current implementation is intentionally minimal, the architecture is designed so that an integration with the full Rapier3D API (with rigid-body handles, contact events, and joints) can be swapped in without changing the component or system interfaces.

---

## 8. Code Generation Pipeline

Because JavaScript does not natively support value-type structs or compile-time memory layouts, Opulence uses a **pre-build code-generation step** to transform human-readable component class definitions into highly optimised static accessor classes.

### Decorator-Driven Definition

A user writes a component class using TypeScript decorators to annotate each field with its storage type:

```typescript
// (conceptual example)
export default class TransformComponent {
  @constructor(0) @hot.float32Array(3)  position: Vec3;
  @constructor(1) @hot.float32Array(3)  rotation: Vec3;
  @constructor(2) @hot.float32Array(3)  scale:    Vec3;
                  @hot.float32Array(16) matrix:   Mat4;
}
```

### AST-Based Compiler

The compiler in `compiler/component_parsers.ts` uses **ts-morph** to parse the TypeScript AST of every `*.component.ts` file found in `game_src/components/`. It:

1. Identifies all decorated properties and their decorator arguments.
2. Computes byte offsets for each field based on the declared size and alignment requirements.
3. Emits a new TypeScript file in `generated/` containing a static class with:
   - A `STRIDE` constant (total component byte size).
   - An `IDENTIFIER` constant (unique integer per component type).
   - A static `initialize(buffer, allocator)` method that sets up typed views.
   - Per-field static getters and setters (`get_position`, `set_position`, etc.) that calculate the exact byte offset into the pre-allocated buffer.
   - A static `new(args)` factory method that reserves the next slot and writes default values.

This approach means that at runtime there is no property lookup, no boxing of primitive values, and no heap allocation per component instance — all access is a simple array index calculation.

---

# Part II — Practical Guide

---

## 9. Project Setup & Build System

### Prerequisites

- **Node.js** ≥ 18 and **pnpm** (the workspace uses `pnpm-workspace.yaml`).
- A browser with WebGPU support. In Chrome, enable the flag at `chrome://flags/#enable-unsafe-webgpu` if needed.

### Installation

```bash
pnpm install
```

### Running a Demo

Each demo lives in its own subdirectory under `game_src/`. Vite's multi-page setup serves them at distinct paths. To run the physics demo:

```bash
pnpm dev
# Then open: http://localhost:5173/game_src/physics/
```

Other available demos:
- `/game_src/physics_multiple/` — Multiple falling boxes
- `/game_src/instancing/` — Up to 10,000 batched cube instances with live count control via `window.plug.instance_target`
- `/game_src/culling/` — Frustum culling stress test

### Configuration

The engine is configured through `opulenece.config.ts` (note the typo in the filename; it is the canonical name):

```typescript
export default {
  componentLocation: "game_src/components/",
  render: {
    maxMeshes:     10_000,      // Maximum unique mesh definitions
    maxInstances:  10_000,      // Maximum concurrent instances
    meshPage:      16_000_000,  // GPU mesh buffer size in bytes (~16 MB)
  },
};
```

---

## 10. Core Engine Walkthrough

The `Engine` class in `src/engine.ts` is the central orchestrator. Its constructor wires together the component memory system and the pointer manager:

```typescript
constructor(canvas: HTMLCanvasElement) {
  super();                             // Extends EventTarget
  this.canvas = canvas;
  this.ecs   = new ECS();             // Allocates all component buffers
  this.pointerManager = new PointerManager();
}
```

### Starting the Engine

```typescript
async start() {
  // Call start() on every registered system (in order)
  await Promise.all(
    this.systems.map(s => s.start ? s.start(this) : Promise.resolve())
  );
  // Hand off to the requestAnimationFrame loop
  startLifecycle(this.update.bind(this));
}
```

`startLifecycle` (in `src/lifecycle.ts`) wraps `requestAnimationFrame` and calls the provided callback each frame with `1/delta` (frames-per-second-normalised delta):

```typescript
export function startLifecycle(fn: (delta: number) => any) {
  let lastTime = performance.now();
  function loop(currentTime: number) {
    frameId = requestAnimationFrame(loop);
    const delta = currentTime - lastTime;
    lastTime = currentTime;
    if (delta > (1 / 60) * 1000 + 1) console.warn(`Skipped frame: ${delta}`);
    fn(1 / delta);   // delta passed as 1/ms ≈ fps-normalised value
  }
  frameId = requestAnimationFrame(loop);
}
```

### Creating Entities and Adding Components

```typescript
const entity = engine.createEntity();

engine.addComponent(entity, TransformComponent, {
  position: new Float32Array([0, 0, 0]),
  rotation: new Float32Array([0, 0, 0]),
  scale:    new Float32Array([1, 1, 1]),
});

engine.addComponent(entity, MeshComponent, {
  meshId: uploadedMeshId,
  color:  new Float32Array([1, 0, 0]),
});
```

`addComponent` calls the generated `ComponentType.new(args)` factory, stores the returned slot index in `entities[entityId][ComponentType.IDENTIFIER]`, and calls `archetypeBasket.addComponent` to migrate the entity to its new archetype.

---

## 11. Components in Practice

### Defining a Component

All components are defined in `game_src/components/` using the decorator API from `src/ecs/component-gen.ts`. The `@constructor(order)` decorator marks which fields are accepted as constructor arguments and in what order. The `@hot.*` decorators specify the in-buffer storage type.

```typescript
// Example: a minimal health component
import { constructor, hot } from "../../src/ecs/component-gen";

export default class HealthComponent {
  @constructor(0) @hot.float32 maxHealth: number;
  @constructor(1) @hot.float32 currentHealth: number;
                  @hot.boolean isDead: boolean;
}
```

After running the compiler (automatically triggered by Vite through the build script), a generated file appears in `generated/` with all static accessor methods pre-computed.

### Built-In Components

| Component | Key Fields | Purpose |
|---|---|---|
| `TransformComponent` | `position`, `rotation`, `scale`, `matrix` | World-space transform |
| `MeshComponent` | `meshId`, `color`, `rendererdInstasnceId`, `batch` | Render appearance |
| `CameraComponent` | `fov`, `near`, `far`, `position`, `projectionMatrix` | Camera projection |
| `RigidbodyComponent` | `mass`, `isStatic`, `velocity` | Physics simulation |
| `ColliderComponent` | `size`, `offset`, `shapeType`, `vertices` | Collision geometry |

### Accessing Component Data

Generated components expose a `.to(instanceId)` method that returns a proxy-like accessor bound to the correct buffer slot:

```typescript
const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];
const transform   = TransformComponent.to(transformId);

// Read
const pos = transform.position;       // Returns a Float32Array view (no copy)
// Write
transform.position = new Float32Array([1, 2, 3]);
```

---

## 12. Systems in Practice

### Implementing a Custom System

```typescript
import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { TransformComponent } from "@generated";

export class RotatorSystem extends System {

  public start(engine: Engine): void {
    // One-time setup: create entities, upload assets, etc.
  }

  public update(entities: number[][], delta: number, engine: Engine): void {
    engine.query(TransformComponent).forEach(entityId => {
      const tId      = engine.entities[entityId][TransformComponent.IDENTIFIER];
      const t        = TransformComponent.to(tId);
      const rotation = t.rotation;

      // Increment Y rotation each frame
      t.rotation = new Float32Array([rotation[0], rotation[1] + delta * 0.001, rotation[2]]);
    });
  }
}
```

### Registering Systems

Systems are registered before calling `engine.start()` and are executed in registration order:

```typescript
engine.systems.push(new RenderSystem(renderer));
engine.systems.push(new RotatorSystem());
engine.systems.push(new PhysicsSystem());
await engine.start();
```

### The Namespace Decorator

Systems (and user-defined components) can be tagged with the `@namespace` decorator for future editor and scene serialisation support:

```typescript
@namespace("game.RotatorSystem")
export class RotatorSystem extends System { ... }
```

---

## 13. The Helios2 Renderer

The renderer lives in `src/renderer/renderer.ts` (~650 lines). Its design centres on minimising CPU/GPU synchronisation points.

### Initialization

```typescript
const renderer = new Helios2Renderer(canvas);
await renderer.initialize();
```

`initialize()` requests a `GPUAdapter` and `GPUDevice`, allocates all GPU buffers (vertex, index, normal, indirect, instance, uniform, visible), compiles the WGSL shader module, and creates the render pipeline and both compute pipelines.

**Buffer stride constants (bytes):**

| Buffer | Stride | Contents |
|---|---|---|
| `vertex` | 12 | XYZ position per vertex |
| `normal` | 12 | XYZ normal per vertex |
| `index` | 4 | `uint32` index |
| `indirect` | 20 | 5× `uint32`: indexCount, instanceCount, firstIndex, baseVertex, firstInstance |
| `instance` | 96 | 4×4 matrix (64 B) + vec4 colour (16 B) + 16 B padding |
| `uniform` | 176 | 4×4 viewProj (64 B) + 6× vec4 frustum planes (96 B) + time/counts (16 B) |
| `visible` | 4 | `uint32` visible instance index |

### Uploading a Mesh

```typescript
const { vertices, indices, normals } = createCube();
const meshId = renderer.uploadMesh(vertices, indices, normals);
```

`uploadMesh` appends vertices, indices, and normals to their respective GPU buffers (`writeBuffer`), records the byte offsets, and returns a `meshId` that serves as the key for all subsequent instancing calls.

### Instancing API

```typescript
// Single instance
const instanceId = renderer._instantiate(meshId, modelMatrix, color);

// Batch of instances (same mesh, different transforms)
const firstId = renderer._instantiateBatch(meshId, [
  { matrix: mat1, color: col1 },
  { matrix: mat2, color: col2 },
]);

// Update an existing instance's transform
renderer._updateMatrix(instanceId, newMatrix);

// Show / hide an instance
renderer._setInstanceEnabled(instanceId, false);   // hides
renderer._setInstanceEnabled(instanceId, true, savedMatrix); // shows
```

### Runtime Diagnostics

The renderer publishes real-time statistics to `window.diagnostics`:

```typescript
{
  totalInstances:   number,  // Total registered instances
  visibleInstances: number,  // Instances that passed frustum culling
  frame:            number,  // Frame counter
  updatedAt:        number,  // Timestamp of last update
}
```

---

## 14. WGSL Shaders Deep Dive

All shaders live in a single file, `src/renderer/shader.wgsl`. WebGPU requires separate entry points for compute and render shaders, identified by the `@compute`, `@vertex`, and `@fragment` attributes.

### Shared Data Structures

```wgsl
struct Uniforms {
    viewProj:       mat4x4<f32>,          // View × Projection matrix
    frustrumPlanes: array<vec4<f32>, 6>,  // Frustum plane equations
    time:           f32,
    instanceCount:  u32,
    frustrumRadius: f32,                  // Bounding-sphere radius for culling
};

struct Instances {
    modelMatrix: mat4x4<f32>,             // Per-instance model matrix
    color:       vec4<f32>,
    commandId:   f32                      // Which indirect command owns this instance
};
```

### Pass 1 — Reset Compute Shader

```wgsl
@compute @workgroup_size(64)
fn reset_main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let index = GlobalInvocationID.x;
    if(index == 0u) {
        atomicStore(&debugBuffer[0], uniforms.instanceCount);
        atomicStore(&debugBuffer[1], 0u);
    }
    if(index >= arrayLength(&commands)) { return; }
    atomicStore(&commands[index].instanceCount, 0u);  // Clear draw count
}
```

This pass clears the `instanceCount` of every indirect draw command to zero, so that the cull pass can re-populate the visible-instance list from scratch each frame.

### Pass 2 — Frustum Cull Compute Shader

```wgsl
fn checkFrustrum(center: vec3<f32>, radius: f32,
                 planes: array<vec4<f32>, 6>) -> bool {
    for(var i = 0; i < 6; i++) {
        let distance = dot(planes[i].xyz, center) + planes[i].w;
        if(distance < -radius) { return false; }  // Outside this plane
    }
    return true;
}

@compute @workgroup_size(64)
fn cull_main(@builtin(global_invocation_id) GlobalInvocationID: vec3<u32>) {
    let index = GlobalInvocationID.x;
    if(index >= uniforms.instanceCount) { return; }

    let center       = ComputeInstanceBuffer[index].modelMatrix[3].xyz;
    let commandIndex = u32(ComputeInstanceBuffer[index].commandId);

    if(checkFrustrum(center, uniforms.frustrumRadius, uniforms.frustrumPlanes)) {
        let outIndex = atomicAdd(&commands[commandIndex].instanceCount, 1u);
        let slot     = commands[commandIndex].firstInstance + outIndex;
        visibleInstancesWrite[slot] = index;
    }
}
```

The frustum planes are extracted on the CPU from the combined view-projection matrix and uploaded in the uniform buffer each frame. The bounding sphere radius (`frustrumRadius`) is a single configurable value applied to all instances — a conservative approximation suitable for uniformly sized objects.

### Pass 3 — Vertex Shader

```wgsl
@vertex
fn vs_main(@builtin(instance_index) ii: u32,
           @location(0) pos:    vec3<f32>,
           @location(1) normal: vec3<f32>) -> VertexOutput {
    let index   = visibleInstances[ii];            // Indirection through cull result
    let inst    = instanceBuffer[index];
    let worldPos = inst.modelMatrix * vec4<f32>(pos, 1.0);

    var out: VertexOutput;
    out.Position = uniforms.viewProj * worldPos;
    out.color    = inst.color;
    out.normal   = (inst.modelMatrix * vec4<f32>(normal, 0.0)).xyz;
    out.fragPos  = worldPos;
    return out;
}
```

The `instance_index` built-in is not a raw instance ID — it is an index into the `visibleInstances` array, which maps back to the actual instance buffer slot. This double-indirection is what allows non-contiguous visible sets without reordering the instance buffer.

### Pass 3 — Fragment Shader (Lambertian Lighting)

```wgsl
@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let N         = normalize(in.normal);
    let lightPos  = vec3<f32>(10.0, 10.0, 10.0);
    let ambient   = vec3<f32>(0.1, 0.1, 0.1);
    let L         = normalize(lightPos - in.fragPos.xyz);
    let dist      = length(lightPos - in.fragPos.xyz);
    let att       = max(1.0 - dist / 1000.0, 0.0);
    let diff      = max(dot(N, L), 0.0);
    let finalRGB  = in.color.rgb * (ambient + lightPos_color * diff * att);
    return vec4<f32>(finalRGB, in.color.a);
}
```

The model implements a simple Phong-like attenuation with a fixed point light. Shadows and secondary lights are not yet implemented.

---

## 15. Complete Example: Physics Demo

The physics demo (`game_src/physics/`) demonstrates the full engine lifecycle: mesh upload, entity creation, component assignment, and the interaction between the render and physics systems.

### Entry Point (`render_test.ts`)

```typescript
import { Engine }          from "../../src/engine";
import { Helios2Renderer } from "../../src/renderer/renderer";
import RenderSystem        from "../../src/ecs/systems/render";
import { PlayerSystem }    from "./systems/player";
import PhysicsSystem       from "../../src/ecs/systems/physics";

const canvas   = document.getElementById("main") as HTMLCanvasElement;
const renderer = new Helios2Renderer(canvas);
const engine   = new Engine(canvas);

engine.renderer = renderer;

engine.load().then(() => {
  renderer.initialize().then(() => {
    engine.systems.push(new RenderSystem(renderer));
    engine.systems.push(new PlayerSystem());
    engine.systems.push(new PhysicsSystem());
    engine.start();
  });
});
```

The three systems are registered in a deliberate order: render, then game logic, then physics. This ensures that matrices are up-to-date before physics reads positions.

### Scene Setup (`PlayerSystem.start`)

```typescript
public start(engine: Engine): void {
  // 1. Upload geometry to GPU
  const cube  = createCube();
  const cubeMeshId  = engine.renderer.uploadMesh(cube.vertices, cube.indices, cube.normals);
  const floor = createPlane();
  const floorMeshId = engine.renderer.uploadMesh(floor.vertices, floor.indices, floor.normals);

  // 2. Create falling cube entity
  const playerEnt = engine.createEntity();
  engine.addComponent(playerEnt, MeshComponent, {
    meshId: cubeMeshId, color: new Float32Array([1, 0, 0]),
  });
  engine.addComponent(playerEnt, TransformComponent, {
    position: new Float32Array([0, 0, 0]),
    rotation: new Float32Array([0, Math.PI / 4, 0]),
    scale:    new Float32Array([1, 1, 1]),
  });
  engine.addComponent(playerEnt, RigidbodyComponent, { mass: 1 });
  engine.addComponent(playerEnt, ColliderComponent, {
    size: new Float32Array([1, 1, 1]), offset: new Float32Array([0, 0, 0]), shapeType: 2,
  });

  // 3. Create static floor entity
  const floorEnt = engine.createEntity();
  engine.addComponent(floorEnt, MeshComponent, {
    meshId: floorMeshId, color: new Float32Array([0.5, 0.5, 0.5]),
  });
  engine.addComponent(floorEnt, TransformComponent, {
    position: new Float32Array([0, -5, 0]),
    rotation: new Float32Array([0, 0, 0]),
    scale:    new Float32Array([20, 1, 20]),
  });
  engine.addComponent(floorEnt, RigidbodyComponent, { isStatic: true });
  engine.addComponent(floorEnt, ColliderComponent, {
    size: new Float32Array([20, 1, 20]), offset: new Float32Array([0, 0, 0]), shapeType: 1,
  });
}
```

### What Happens Each Frame

1. **RenderSystem** queries entities with `MeshComponent + TransformComponent`.  
   - For each entity it calls `calculateTransformMatrix` (T×Rz×Ry×Rx×S using pre-allocated scratchpad matrices) and calls `renderer._updateMatrix` with the result.  
   - At the end it sets the camera position by orbiting the origin and calls `renderer.render()`.

2. **PlayerSystem** reads `TransformComponent` to inspect the current position (can also drive input-based movement here).

3. **PhysicsSystem** queries entities with `RigidbodyComponent + TransformComponent + ColliderComponent`.  
   - For each non-static body it applies gravity, integrates velocity, and writes back the new position to `TransformComponent`.  
   - A ground collision at `y = -4` zeroes the vertical velocity.

4. **Helios2Renderer** executes the three GPU passes (reset, cull, render) and presents the result to the canvas swap chain.

### Instancing Demo Highlights

The instancing demo (`game_src/instancing/`) pre-creates 10,000 cube entities but keeps most of them hidden. A `window.plug.instance_target` value controls how many are currently visible. The key feature is the `batch: true` flag on `MeshComponent` and `TransformComponent`, which tells `RenderSystem` to collect all transforms for the same `meshId` into a single `_instantiateBatch` call instead of issuing one GPU write per entity.

```typescript
engine.addComponent(entity, MeshComponent, {
  color:  new Float32Array([Math.random(), Math.random(), Math.random()]),
  meshId: this.cubeMeshId,
  batch:  true,   // ← signals batch rendering
});
```

This allows the demo to sustain thousands of animated instances while keeping the number of GPU commands constant.

---

## Primitive Mesh Library

The `src/renderer/primitive.ts` module provides ready-made mesh generators. Each function returns a plain object with three typed arrays:

```typescript
interface MeshData {
  vertices: Float32Array;   // XYZ positions (3 floats per vertex)
  indices:  Uint32Array;    // Triangle indices
  normals:  Float32Array;   // XYZ normals (3 floats per vertex)
}
```

| Function | Description |
|---|---|
| `createCube()` | 8-vertex, 12-triangle cube with per-face flat normals |
| `createPyramid()` | Triangular pyramid (4 faces) |
| `createDiamond()` | Octahedron-like diamond shape |
| `createPlane()` | Single flat quad (4 vertices, 2 triangles) |

These primitives are useful for prototyping and physics colliders. Custom geometry can be loaded from `.glb`/`.gltf` files — the Vite config includes GLTF in its `assetsInclude` list, and raw vertex data can be passed directly to `renderer.uploadMesh`.

---

## Summary

Opulence Engine demonstrates how a modern, performance-focused game engine can be built on top of web standards. Its key engineering decisions — archetype-based ECS for cache-friendly queries, GPU-driven indirect rendering for massive draw-call reduction, compute-shader frustum culling to avoid unnecessary fragment work, and a compile-time code-generation pipeline to eliminate runtime overhead — combine into a coherent architecture that scales from single-object physics scenes to thousands of batched instances.

The codebase is intentionally small (~1,800 lines of TypeScript source) and designed to be readable. Each subsystem (ECS, renderer, physics, memory) is encapsulated behind a stable interface, making it straightforward to extend or replace individual components — for example, swapping the physics backend from cannon-es to Rapier3D, or adding a shadow-mapping render pass to the Helios2 renderer.
