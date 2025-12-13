# GLTF Rendering Integration Guide

This guide explains how to load and render GLTF/GLB models using the Opulence Engine.

## Overview

The engine provides a complete pipeline for loading GLTF files and rendering them:

1. **`gltf-loader.ts`** - Loads GLTF/GLB files and converts them to `Mesh` instances
2. **`mesh.ts`** - Represents a renderable mesh with GPU buffers
3. **`renderer.ts`** - Renders meshes using WebGPU

## Vertex Format

The engine uses a specific vertex format with a stride of 10 floats (40 bytes):

| Attribute | Type | Floats | Offset (bytes) | Shader Location |
|-----------|------|--------|----------------|-----------------|
| Position  | vec3 | 3      | 0              | 0               |
| Normal    | vec3 | 3      | 12             | 1               |
| Color/Tangent | vec4 | 4  | 24             | 2               |

**Total stride:** 10 floats = 40 bytes

## Quick Start

### 1. Basic GLTF Loading

```typescript
import { loadglb } from "./files/gltf-loader";

// Load a GLTF/GLB file
const meshes = await loadglb("./models/mymodel.glb");

// Initialize meshes with GPU device
for (const mesh of meshes) {
  mesh.start(device);
}

console.log(`Loaded ${meshes.length} mesh(es)`);
```

### 2. Creating Entities for Rendering

To render GLTF meshes, you need to create entities with transform components:

```typescript
import { loadglb } from "./files/gltf-loader";
import { Entity } from "./entity";
import { TransformComponent } from "./ecs/components/transform";
import { mat4 } from "wgpu-matrix";

// Load the model
const meshes = await loadglb("./models/character.glb");

// Create entities for each mesh
const entities = [];

for (const mesh of meshes) {
  // Initialize mesh with GPU device
  mesh.start(device);
  
  // Create entity
  const entity = new Entity();
  
  // Create transform component
  const transform = new TransformComponent();
  transform.position = [0, 0, 0];
  transform.rotation = [0, 0, 0];
  transform.scale = [1, 1, 1];
  
  // Add to render list
  entities.push({
    entity: entity,
    mesh: mesh,
    transform: transform
  });
}
```

### 3. Rendering in Your Game Loop

```typescript
import { Renderer } from "./renderer/renderer";
import { mat4 } from "wgpu-matrix";

// Assuming you have a renderer initialized
const renderer = new Renderer(canvas, shaderSource);
await renderer.initialize();

// In your game loop
function gameLoop(time: number) {
  // Set up camera
  const cameraPosition = [0, 5, 10];
  
  // Create projection matrix (example perspective)
  const aspect = canvas.width / canvas.height;
  const projectionMatrix = mat4.perspective(
    Math.PI / 4,  // 45 degree FOV
    aspect,
    0.1,          // near plane
    100.0         // far plane
  );
  
  // Create view matrix
  const viewMatrix = mat4.lookAt(
    cameraPosition,           // camera position
    [0, 0, 0],               // look at target
    [0, 1, 0]                // up vector
  );
  
  // Combine view and projection
  const viewProjection = mat4.multiply(projectionMatrix, viewMatrix);
  
  // Render all entities
  renderer.render(entities, time, cameraPosition, viewProjection);
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

## Complete Example

```typescript
import { loadglb } from "./files/gltf-loader";
import { Renderer } from "./renderer/renderer";
import { Entity } from "./entity";
import { TransformComponent } from "./ecs/components/transform";
import { mat4, vec3 } from "wgpu-matrix";

class GLTFScene {
  private renderer: Renderer;
  private entities: any[] = [];
  private device: GPUDevice;
  
  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    this.renderer = new Renderer(canvas, shaderSource);
  }
  
  async initialize() {
    await this.renderer.initialize();
    this.device = this.renderer.device!;
  }
  
  async loadModel(path: string, position = [0, 0, 0], scale = [1, 1, 1]) {
    // Load GLTF file
    const meshes = await loadglb(path);
    
    console.log(`Loaded ${meshes.length} mesh(es) from ${path}`);
    
    // Create entities for each mesh
    for (const mesh of meshes) {
      mesh.start(this.device);
      
      const entity = new Entity();
      const transform = new TransformComponent();
      
      transform.position = position;
      transform.scale = scale;
      transform.rotation = [0, 0, 0];
      
      this.entities.push({
        entity: entity,
        mesh: mesh,
        transform: transform
      });
      
      console.log(`Mesh AABB:`, mesh.AABB);
    }
  }
  
  render(time: number, cameraPos: vec3, viewProjection: mat4) {
    this.renderer.render(this.entities, time, cameraPos, viewProjection);
  }
  
  getEntities() {
    return this.entities;
  }
}

// Usage
const scene = new GLTFScene(canvas, shaderSource);
await scene.initialize();

// Load multiple models
await scene.loadModel("./models/ground.glb", [0, 0, 0], [10, 1, 10]);
await scene.loadModel("./models/character.glb", [0, 0, 0], [1, 1, 1]);
await scene.loadModel("./models/tree.glb", [5, 0, 5], [2, 2, 2]);

// Render loop
let time = 0;
function gameLoop() {
  time += 0.016;
  
  const cameraPos = vec3.create(
    Math.sin(time) * 10,
    5,
    Math.cos(time) * 10
  );
  
  const viewMatrix = mat4.lookAt(cameraPos, [0, 0, 0], [0, 1, 0]);
  const projectionMatrix = mat4.perspective(
    Math.PI / 4,
    canvas.width / canvas.height,
    0.1,
    100.0
  );
  
  const viewProjection = mat4.multiply(projectionMatrix, viewMatrix);
  
  scene.render(time, cameraPos, viewProjection);
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

## GLTF Loader Details

### Supported Attributes

The GLTF loader extracts the following attributes from GLTF primitives:

- **POSITION** (required) - Vertex positions
- **NORMAL** (optional) - Vertex normals (defaults to [0, 1, 0] if missing)
- **TANGENT** (optional) - Stored in the color/tangent slot
- **COLOR_0** (optional) - Vertex colors (used if tangents not present)
- **TEXCOORD_0** (optional) - UV coordinates (stored in first 2 components of vec4)

### Attribute Priority

The 4th vertex attribute (color/tangent) is filled with the following priority:

1. **TANGENT** - If present, uses tangent data
2. **COLOR_0** - If no tangent, uses vertex colors
3. **TEXCOORD_0** - If no colors, stores UV in first 2 components
4. **Default** - White color [1, 1, 1, 1] if none present

### Index Buffer Handling

- Supports both indexed and non-indexed geometry
- Converts Uint32Array indices to Uint16Array (may cause issues with >65k vertices)
- Generates sequential indices for non-indexed geometry

## Mesh Class API

### Properties

```typescript
mesh.vertexBuffer: GPUBuffer    // GPU vertex buffer
mesh.indexBuffer: GPUBuffer     // GPU index buffer
mesh.vertices: Float32Array     // CPU vertex data
mesh.indices: Uint16Array       // CPU index data
mesh.vertexCount: number        // Total floats in vertex array
mesh.indexCount: number         // Total indices
mesh.AABB: { min: Vec3, max: Vec3 }  // Bounding box
```

### Methods

```typescript
// Initialize mesh with GPU device (creates GPU buffers)
mesh.start(device: GPUDevice): void
```

## Advanced Usage

### Transforming Loaded Models

```typescript
const meshes = await loadglb("./models/car.glb");

for (const mesh of meshes) {
  mesh.start(device);
  
  const transform = new TransformComponent();
  
  // Position the car
  transform.position = [10, 0, -5];
  
  // Rotate 90 degrees around Y axis
  transform.rotation = [0, Math.PI / 2, 0];
  
  // Make it bigger
  transform.scale = [2, 2, 2];
  
  entities.push({ entity: new Entity(), mesh, transform });
}
```

### Accessing Mesh Bounds

```typescript
const meshes = await loadglb("./models/building.glb");

for (const mesh of meshes) {
  mesh.start(device);
  
  const { min, max } = mesh.AABB;
  const width = max[0] - min[0];
  const height = max[1] - min[1];
  const depth = max[2] - min[2];
  
  console.log(`Mesh dimensions: ${width} x ${height} x ${depth}`);
  
  // Center the mesh at origin
  const center = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2
  ];
  
  transform.position = [-center[0], -center[1], -center[2]];
}
```

### Loading Multiple Models Efficiently

```typescript
async function loadMultipleModels(device: GPUDevice, paths: string[]) {
  const allMeshes = await Promise.all(
    paths.map(path => loadglb(path))
  );
  
  const entities = [];
  
  for (const meshes of allMeshes) {
    for (const mesh of meshes) {
      mesh.start(device);
      
      const entity = new Entity();
      const transform = new TransformComponent();
      
      entities.push({ entity, mesh, transform });
    }
  }
  
  return entities;
}

// Usage
const entities = await loadMultipleModels(device, [
  "./models/level1.glb",
  "./models/level2.glb",
  "./models/props.glb"
]);
```

## Troubleshooting

### Issue: Model doesn't appear

**Check:**
1. Camera position and view matrix are correct
2. Model is within view frustum
3. Mesh was initialized with `mesh.start(device)`
4. Projection matrix is set up correctly

### Issue: Model appears black

**Check:**
1. Normals are present in the GLTF file
2. Lighting is set up in the renderer
3. Shader is using normal data correctly

### Issue: Large models have rendering issues

**Cause:** Index buffer uses Uint16Array (max 65,535 vertices)

**Solution:** Split large models into smaller chunks or modify the Mesh class to support Uint32Array indices

### Issue: Model appears inside-out

**Cause:** Winding order mismatch

**Solution:** Flip backface culling in renderer or adjust GLTF export settings

## Performance Tips

1. **Batch loading:** Load all models at startup to avoid runtime hitches
2. **Reuse meshes:** Share mesh data between multiple entities
3. **Frustum culling:** Don't render meshes outside camera view using AABB
4. **LOD:** Use different detail levels based on distance
5. **Instancing:** For repeated objects, consider instanced rendering

## Next Steps

- Implement texture loading from GLTF materials
- Add animation support for skinned meshes
- Implement PBR material rendering
- Add LOD (Level of Detail) support
- Implement frustum culling using AABB data