import { loadglb, quaternionToEuler } from "../files/gltf-loader";
import { GLTFScene } from "../files/gltf-scene";
import { Renderer } from "../renderer/renderer";
import { mat4, vec3 } from "wgpu-matrix";

/**
 * GLTF Transform Example
 *
 * This example demonstrates how to use the original transform data from GLTF files.
 * GLTF files contain a scene graph with nodes that have position, rotation, and scale.
 * These transforms are now preserved and applied to your meshes automatically!
 */

// ============================================================================
// Example 1: Using Preserved GLTF Transforms (Default Behavior)
// ============================================================================

export async function example1_PreserveTransforms(device: GPUDevice) {
  const scene = new GLTFScene(device);

  // By default, preserveGLTFTransforms is TRUE
  // This loads the model with its original transforms from the GLTF file
  await scene.loadModel("./models/scene.glb");

  // All meshes will be positioned, rotated, and scaled exactly as they were
  // in the original 3D software (Blender, Maya, etc.)

  const instances = scene.getInstances();
  console.log("Loaded instances with original transforms:");

  instances.forEach((instance, i) => {
    console.log(`Instance ${i}: ${instance.name}`);
    console.log(`  Position: [${instance.transform.position}]`);
    console.log(`  Rotation: [${instance.transform.rotation}]`);
    console.log(`  Scale: [${instance.transform.scale}]`);
  });

  return scene;
}

// ============================================================================
// Example 2: Override GLTF Transforms
// ============================================================================

export async function example2_OverrideTransforms(device: GPUDevice) {
  const scene = new GLTFScene(device);

  // You can override the GLTF transforms by providing your own
  await scene.loadModel("./models/car.glb", {
    position: [10, 0, 5],      // Override position
    rotation: [0, Math.PI, 0], // Override rotation (180 degrees around Y)
    scale: [2, 2, 2],          // Override scale (make it 2x bigger)
  });

  // All instances from this model will use YOUR transforms instead of GLTF's
  console.log("Loaded with overridden transforms");

  return scene;
}

// ============================================================================
// Example 3: Disable Transform Preservation
// ============================================================================

export async function example3_DisableTransforms(device: GPUDevice) {
  const scene = new GLTFScene(device);

  // Set preserveGLTFTransforms to false to load everything at origin
  await scene.loadModel("./models/building.glb", {
    preserveGLTFTransforms: false, // Ignore GLTF transforms
    position: [0, 0, 0],            // Everything at origin
    scale: [1, 1, 1],
  });

  // Useful when you want complete control and don't care about
  // the original scene layout
  console.log("Loaded at origin, ignoring GLTF scene graph");

  return scene;
}

// ============================================================================
// Example 4: Direct Loading with Transform Data
// ============================================================================

export async function example4_DirectLoading(device: GPUDevice) {
  // Load directly and inspect the transform data
  const instances = await loadglb("./models/scene.glb", {
    preserveTransforms: true,
  });

  console.log(`Loaded ${instances.length} mesh instances:`);

  for (const instance of instances) {
    // Initialize the mesh
    instance.mesh.start(device);

    // Access the original GLTF transform data
    console.log(`\nMesh: ${instance.name}`);
    console.log(`  Position: [${instance.position}]`);
    console.log(`  Rotation (quaternion): [${instance.rotation}]`);
    console.log(`  Scale: [${instance.scale}]`);

    // Convert quaternion to Euler angles if needed
    const euler = quaternionToEuler(instance.rotation);
    console.log(`  Rotation (Euler radians): [${euler}]`);
    console.log(`  Rotation (Euler degrees): [${euler.map(r => r * 180 / Math.PI)}]`);
  }

  return instances;
}

// ============================================================================
// Example 5: Complex Scene with Multiple Models
// ============================================================================

export async function example5_ComplexScene(device: GPUDevice) {
  const scene = new GLTFScene(device);

  // Load level geometry with original transforms
  await scene.loadModel("./models/level.glb", {
    name: "level",
    preserveGLTFTransforms: true, // Use original layout
  });

  // Load a character at a specific spawn point (override transforms)
  await scene.loadModel("./models/character.glb", {
    name: "player",
    position: [0, 0, 0],           // Player spawn point
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    preserveGLTFTransforms: false, // Ignore GLTF position
  });

  // Load props with original transforms, but scale them all up
  await scene.loadModel("./models/props.glb", {
    name: "props",
    scale: [1.5, 1.5, 1.5],        // Make all props 50% bigger
    preserveGLTFTransforms: true,   // But keep their positions/rotations
  });

  console.log("Complex scene loaded:");
  console.log(`  Total instances: ${scene.getInstanceCount()}`);
  console.log(`  Level instances: ${scene.getInstancesByName("level").length}`);
  console.log(`  Player instances: ${scene.getInstancesByName("player").length}`);
  console.log(`  Prop instances: ${scene.getInstancesByName("props").length}`);

  return scene;
}

// ============================================================================
// Example 6: Inspecting Scene Hierarchy
// ============================================================================

export async function example6_InspectHierarchy(device: GPUDevice) {
  // Load with transforms to see the scene structure
  const instances = await loadglb("./models/scene.glb");

  console.log("\n=== GLTF Scene Hierarchy ===\n");

  // Group by node index to see which meshes belong to the same node
  const nodeGroups = new Map<number, typeof instances>();

  instances.forEach(instance => {
    if (instance.nodeIndex !== undefined) {
      if (!nodeGroups.has(instance.nodeIndex)) {
        nodeGroups.set(instance.nodeIndex, []);
      }
      nodeGroups.get(instance.nodeIndex)!.push(instance);
    }
  });

  nodeGroups.forEach((meshes, nodeIndex) => {
    console.log(`Node ${nodeIndex}:`);
    meshes.forEach(mesh => {
      console.log(`  - ${mesh.name}`);
      console.log(`    Position: [${mesh.position.map(v => v.toFixed(2))}]`);
      console.log(`    Scale: [${mesh.scale.map(v => v.toFixed(2))}]`);
    });
    console.log();
  });

  return instances;
}

// ============================================================================
// Example 7: Modifying Transforms After Loading
// ============================================================================

export async function example7_ModifyAfterLoading(device: GPUDevice) {
  const scene = new GLTFScene(device);

  // Load with original transforms
  await scene.loadModel("./models/furniture.glb", {
    name: "furniture",
  });

  // Find a specific piece and move it
  const chairs = scene.getInstancesByName("furniture");

  chairs.forEach((chair, index) => {
    // Move each chair 5 units to the right
    chair.transform.position[0] += 5;

    // Rotate each chair 45 degrees
    chair.transform.rotation[1] += Math.PI / 4;

    console.log(`Moved chair ${index} to position: [${chair.transform.position}]`);
  });

  return scene;
}

// ============================================================================
// Example 8: Complete Rendering Example with Transforms
// ============================================================================

export class GLTFTransformRenderer {
  private scene: GLTFScene;
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, shaderSource);
  }

  async initialize() {
    await this.renderer.initialize();
    this.scene = new GLTFScene(this.renderer.device!);
  }

  async loadScene(path: string, options?: {
    preserveTransforms?: boolean;
    additionalOffset?: [number, number, number];
  }) {
    const { preserveTransforms = true, additionalOffset } = options || {};

    // Load the model
    await this.scene.loadModel(path, {
      preserveGLTFTransforms: preserveTransforms,
    });

    // Apply additional offset if provided
    if (additionalOffset) {
      const instances = this.scene.getInstances();
      instances.forEach(instance => {
        instance.transform.position[0] += additionalOffset[0];
        instance.transform.position[1] += additionalOffset[1];
        instance.transform.position[2] += additionalOffset[2];
      });
    }

    // Log scene bounds
    const bounds = this.scene.getSceneBounds();
    if (bounds) {
      console.log("Scene bounds:");
      console.log(`  Min: [${bounds.min}]`);
      console.log(`  Max: [${bounds.max}]`);

      const size = vec3.subtract(bounds.max, bounds.min);
      console.log(`  Size: [${size}]`);
    }
  }

  render(time: number, cameraPos: Float32Array, viewProjection: Float32Array) {
    const entities = this.scene.getRenderableEntities();
    this.renderer.render(entities, time, cameraPos, viewProjection);
  }

  getScene(): GLTFScene {
    return this.scene;
  }
}

// ============================================================================
// Usage
// ============================================================================

/**
 * Usage Example:
 *
 * // Load with original GLTF transforms
 * const scene = await example1_PreserveTransforms(device);
 *
 * // Or with custom transforms
 * const scene2 = await example2_OverrideTransforms(device);
 *
 * // Render
 * const entities = scene.getRenderableEntities();
 * renderer.render(entities, time, cameraPos, viewProjection);
 */

/**
 * Key Points:
 *
 * 1. By default, GLTF transforms ARE preserved (preserveGLTFTransforms: true)
 * 2. You can override specific transforms (position, rotation, scale) while
 *    keeping others from the GLTF file
 * 3. Set preserveGLTFTransforms: false to ignore GLTF scene graph completely
 * 4. Rotations in GLTF are quaternions, automatically converted to Euler angles
 * 5. You can modify transforms after loading through the instance objects
 * 6. Scene bounds are calculated with transforms applied
 */
