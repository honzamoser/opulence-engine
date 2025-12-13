import { GLTFScene } from "../files/gltf-scene";
import { Renderer } from "../renderer/renderer";
import { Light } from "../renderer/light";
import { mat4, vec3 } from "wgpu-matrix";

/**
 * Complete GLTF Rendering Example
 *
 * This example demonstrates a full workflow for loading and rendering GLTF models:
 * 1. Initialize WebGPU renderer
 * 2. Load GLTF models using GLTFScene utility
 * 3. Set up camera and lighting
 * 4. Render loop with camera controls
 */

// Shader source for rendering meshes
const SHADER_SOURCE = `
struct SceneUniforms {
  viewProjection: mat4x4<f32>,
  cameraPosition: vec3<f32>,
  _padding1: f32,
  lightCount: u32,
  _padding2: u32,
  _padding3: u32,
  _padding4: u32,
  lights: array<Light, 8>,
}

struct Light {
  position: vec3<f32>,
  range: f32,
  color: vec3<f32>,
  intensity: f32,
}

struct ObjectUniforms {
  model: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(1) @binding(0) var<uniform> object: ObjectUniforms;

struct VertexInput {
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) color: vec4<f32>,
}

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) worldPosition: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) color: vec4<f32>,
}

@vertex
fn vs_main(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let worldPosition = object.model * vec4<f32>(input.position, 1.0);
  output.worldPosition = worldPosition.xyz;
  output.position = scene.viewProjection * worldPosition;

  let normalMatrix = mat3x3<f32>(
    object.model[0].xyz,
    object.model[1].xyz,
    object.model[2].xyz
  );
  output.normal = normalize(normalMatrix * input.normal);
  output.color = input.color;

  return output;
}

@fragment
fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
  let normal = normalize(input.normal);

  // Ambient lighting
  let ambient = vec3<f32>(0.1, 0.1, 0.1);

  // Calculate lighting from all lights
  var totalLight = ambient;

  for (var i = 0u; i < scene.lightCount; i++) {
    let light = scene.lights[i];
    let lightDir = light.position - input.worldPosition;
    let distance = length(lightDir);
    let lightDirNorm = normalize(lightDir);

    // Diffuse
    let diffuse = max(dot(normal, lightDirNorm), 0.0);

    // Attenuation
    let attenuation = 1.0 / (1.0 + distance * distance / (light.range * light.range));

    // Specular
    let viewDir = normalize(scene.cameraPosition - input.worldPosition);
    let halfDir = normalize(lightDirNorm + viewDir);
    let specular = pow(max(dot(normal, halfDir), 0.0), 32.0);

    totalLight += (diffuse + specular * 0.5) * light.color * light.intensity * attenuation;
  }

  let finalColor = input.color.rgb * totalLight;

  return vec4<f32>(finalColor, input.color.a);
}
`;

export class CompleteGLTFExample {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private gltfScene: GLTFScene;
  private camera: {
    position: Float32Array;
    target: Float32Array;
    distance: number;
    angle: number;
    height: number;
  };
  private animationFrameId: number | null = null;
  private startTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas, SHADER_SOURCE);

    // Initialize camera
    this.camera = {
      position: vec3.create(0, 5, 10),
      target: vec3.create(0, 0, 0),
      distance: 10,
      angle: 0,
      height: 5,
    };
  }

  /**
   * Initialize the renderer and GLTF scene
   */
  async initialize(): Promise<void> {
    console.log("Initializing renderer...");
    await this.renderer.initialize();

    if (!this.renderer.device) {
      throw new Error("Failed to initialize WebGPU device");
    }

    console.log("Renderer initialized successfully");

    this.gltfScene = new GLTFScene(this.renderer.device);

    // Set up lighting
    this.setupLighting();
  }

  /**
   * Set up scene lighting
   */
  private setupLighting(): void {
    // Main light
    const mainLight = new Light([5, 10, 5], 50, [1.0, 0.95, 0.9], 1.0);

    // Fill light
    const fillLight = new Light([-5, 5, -5], 30, [0.5, 0.6, 0.8], 0.5);

    this.renderer.lights = [mainLight, fillLight];
  }

  /**
   * Load GLTF models into the scene
   */
  async loadModels(): Promise<void> {
    try {
      // Example: Load a single model at the origin
      await this.gltfScene.loadModel("./models/scene.glb", {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        name: "main_model",
      });

      // Example: Load multiple models
      // Uncomment and adjust paths as needed:
      /*
      await this.gltfScene.loadModel("./models/ground.glb", {
        position: [0, -1, 0],
        scale: [10, 1, 10],
        name: "ground",
      });

      await this.gltfScene.loadModel("./models/prop.glb", {
        position: [3, 0, 3],
        scale: [0.5, 0.5, 0.5],
        name: "prop1",
      });

      await this.gltfScene.loadModel("./models/prop.glb", {
        position: [-3, 0, -3],
        scale: [0.5, 0.5, 0.5],
        name: "prop2",
      });
      */

      console.log(`Loaded ${this.gltfScene.getInstanceCount()} instances`);
      console.log(`Total vertices: ${this.gltfScene.getTotalVertexCount()}`);
      console.log(`Total indices: ${this.gltfScene.getTotalIndexCount()}`);

      // Print scene bounds
      const bounds = this.gltfScene.getSceneBounds();
      if (bounds) {
        console.log("Scene bounds:", bounds);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update camera position (orbital camera)
   */
  private updateCamera(deltaTime: number): void {
    // Rotate camera around target
    this.camera.angle += deltaTime * 0.2;

    const x = Math.cos(this.camera.angle) * this.camera.distance;
    const z = Math.sin(this.camera.angle) * this.camera.distance;

    this.camera.position = vec3.create(x, this.camera.height, z);
  }

  /**
   * Create view-projection matrix
   */
  private createViewProjectionMatrix(): Float32Array {
    const aspect = this.canvas.width / this.canvas.height;

    // Projection matrix
    const projectionMatrix = mat4.perspective(
      Math.PI / 4, // 45 degree FOV
      aspect,
      0.1,
      100.0,
    );

    // View matrix
    const viewMatrix = mat4.lookAt(
      this.camera.position,
      this.camera.target,
      vec3.create(0, 1, 0),
    );

    // Combine
    return mat4.multiply(projectionMatrix, viewMatrix);
  }

  /**
   * Render loop
   */
  private render = (timestamp: number): void => {
    if (this.startTime === 0) {
      this.startTime = timestamp;
    }

    const time = (timestamp - this.startTime) / 1000; // Convert to seconds
    const deltaTime = 0.016; // Approximate 60fps

    // Update camera
    this.updateCamera(deltaTime);

    // Optional: Update model transforms
    // Example: Rotate a specific model
    /*
    this.gltfScene.updateTransform("main_model", {
      rotation: [0, time * 0.5, 0],
    });
    */

    // Create view-projection matrix
    const viewProjection = this.createViewProjectionMatrix();

    // Get entities to render
    const entities = this.gltfScene.getRenderableEntities();

    // Render the scene
    if (entities.length > 0) {
      this.renderer.render(
        entities,
        time,
        this.camera.position,
        viewProjection,
      );
    }

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Start the render loop
   */
  start(): void {
    if (this.animationFrameId === null) {
      console.log("Starting render loop");
      this.startTime = 0;
      this.animationFrameId = requestAnimationFrame(this.render);
    }
  }

  /**
   * Stop the render loop
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log("Stopped render loop");
    }
  }

  /**
   * Set camera distance
   */
  setCameraDistance(distance: number): void {
    this.camera.distance = distance;
  }

  /**
   * Set camera height
   */
  setCameraHeight(height: number): void {
    this.camera.height = height;
  }

  /**
   * Set camera target
   */
  setCameraTarget(target: [number, number, number]): void {
    this.camera.target = vec3.create(...target);
  }

  /**
   * Get loaded GLTF scene
   */
  getGLTFScene(): GLTFScene {
    return this.gltfScene;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.gltfScene.clear();
  }
}

/**
 * Usage Example:
 *
 * // HTML:
 * // <canvas id="webgpu-canvas" width="800" height="600"></canvas>
 *
 * // TypeScript:
 * const canvas = document.getElementById('webgpu-canvas') as HTMLCanvasElement;
 * const example = new CompleteGLTFExample(canvas);
 *
 * await example.initialize();
 * await example.loadModels();
 * example.start();
 *
 * // Optional: Adjust camera
 * example.setCameraDistance(15);
 * example.setCameraHeight(8);
 *
 * // Later, to stop:
 * example.stop();
 */

/**
 * Quick start function for simple usage
 */
export async function quickStartGLTF(
  canvas: HTMLCanvasElement,
  modelPath: string,
): Promise<CompleteGLTFExample> {
  const example = new CompleteGLTFExample(canvas);
  await example.initialize();

  // Load the model
  await example.getGLTFScene().loadModel(modelPath);

  // Start rendering
  example.start();

  return example;
}

/**
 * Quick start usage:
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const example = await quickStartGLTF(canvas, './models/mymodel.glb');
 *
 * // That's it! Your model is now rendering.
 */
