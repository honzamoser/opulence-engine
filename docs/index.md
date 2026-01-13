# **Opulence** Game Engine

An ECS based game engine built with TypeScript, leaning on WebGPU and cutting edge web technologies.

## Why?

There are plenty of game engines that are way more advanced than this one is. However, I wanted to take a shot at building an open-source, typescript based and performant web-based game engine.

I focus on the rendering being fast, logic being efficient all while the API and editor are not a pain to use.

## How?

Currently (as of no release), the engine consists of 2 larger parts:
- The (Opulence) ECS (Entity, Component, System) system
- The (Helios2) Renderer.

### **The ECS engine**

The ECS engine was inspired by other high-end ECS systems.

**Features**:
- *Entites*
  - Zero allocation entities
- *Components*
  - A single interleaved buffer for component storage
  - Hot and Cold storage systems
    - Hot = fixed-size, strongly typed data, stored directly in the main interleaved buffer.
    - Cold = a pointer-based system, storing dynamic data in a heap-like buffer system.
  - Dynamic component structure creation using decorators. [Example](../src/ecs/components/transform.ts)
- *Systems*
  - Systems running every frame with a system for querying entities for components (see: TODO: Archetype based lookup   )
