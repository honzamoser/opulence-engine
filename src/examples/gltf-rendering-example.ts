import { loadglb } from "../files/gltf-loader";
import { Mesh } from "../renderer/mesh";
import { Renderer } from "../renderer/renderer";

/**
 * Example: Loading and rendering GLTF models
 *
 * This example demonstrates how to:
 * 1. Load a GLTF/GLB file
 * 2. Convert it to Mesh instances
 * 3. Initialize the meshes with a GPU device
 * 4. Render them using the renderer
 */

export class GLTFRenderingExample {
  private renderer: Renderer;
  private device: GPUDevice;
  private meshes: Mesh[] = [];

  constructor(renderer: Renderer, device: GPUDevice) {
    this.renderer = renderer;
    this.device = device;
  }

  /**
   * Load a GLTF/GLB file and prepare it for rendering
   */
  async loadModel(path: string): Promise<void> {
    try {
      console.log(`Loading GLTF model from: ${path}`);

      // Load the GLTF file and get mesh instances with transform data
      const instances = await loadglb(path);

      console.log(`Loaded ${instances.length} mesh instance(s) from GLTF file`);

      // Initialize each mesh with the GPU device
      for (const instance of instances) {
        instance.mesh.start(this.device);
        this.meshes.push(instance.mesh);

        console.log(`Mesh initialized: ${instance.name}`, {
          vertexCount: instance.mesh.vertexCount,
          indexCount: instance.mesh.indexCount,
          aabbMin: instance.mesh.AABB.min,
          aabbMax: instance.mesh.AABB.max,
          position: instance.position,
          scale: instance.scale,
        });
      }

      console.log("All meshes loaded and initialized successfully!");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load multiple GLTF models
   */
  async loadModels(paths: string[]): Promise<void> {
    for (const path of paths) {
      await this.loadModel(path);
    }
  }

  /**
   * Get all loaded meshes
   */
  getMeshes(): Mesh[] {
    return this.meshes;
  }

  /**
   * Get a specific mesh by index
   */
  getMesh(index: number): Mesh | undefined {
    return this.meshes[index];
  }

  /**
   * Clear all loaded meshes
   */
  clear(): void {
    // Note: You may want to destroy GPU buffers here
    // if your Mesh class has a cleanup/destroy method
    this.meshes = [];
  }

  /**
   * Get the total vertex count across all meshes
   */
  getTotalVertexCount(): number {
    return this.meshes.reduce((sum, mesh) => sum + mesh.vertexCount, 0);
  }

  /**
   * Get the total index count across all meshes
   */
  getTotalIndexCount(): number {
    return this.meshes.reduce((sum, mesh) => sum + mesh.indexCount, 0);
  }
}

/**
 * Usage example:
 *
 * ```typescript
 * // Assuming you have a renderer and device set up
 * const gltfExample = new GLTFRenderingExample(renderer, device);
 *
 * // Load a single model
 * await gltfExample.loadModel("./models/mymodel.glb");
 *
 * // Get the meshes to render
 * const meshes = gltfExample.getMeshes();
 *
 * // In your render loop, iterate through meshes:
 * for (const mesh of meshes) {
 *   // Set vertex buffer
 *   passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
 *
 *   // Set index buffer
 *   passEncoder.setIndexBuffer(mesh.indexBuffer, "uint16");
 *
 *   // Draw indexed
 *   passEncoder.drawIndexed(mesh.indexCount, 1, 0, 0, 0);
 * }
 * ```
 */

/**
 * Simple standalone function example:
 */
export async function simpleGLTFLoad(
  device: GPUDevice,
  modelPath: string,
): Promise<Mesh[]> {
  // Load GLTF file with transform data
  const instances = await loadglb(modelPath);

  // Initialize each mesh with GPU device
  const meshes: Mesh[] = [];
  for (const instance of instances) {
    instance.mesh.start(device);
    meshes.push(instance.mesh);
  }

  return meshes;
}

/**
 * Usage:
 * ```typescript
 * const meshes = await simpleGLTFLoad(device, "./path/to/model.glb");
 *
 * // Render in your render loop
 * meshes.forEach(mesh => {
 *   passEncoder.setVertexBuffer(0, mesh.vertexBuffer);
 *   passEncoder.setIndexBuffer(mesh.indexBuffer, "uint16");
 *   passEncoder.drawIndexed(mesh.indexCount);
 * });
 * ```
 */
