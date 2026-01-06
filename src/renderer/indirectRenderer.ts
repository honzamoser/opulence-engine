import { Mat4, Vec3 } from "wgpu-matrix";
import shader from "../../resources/shaders/basic_indirect.wgsl?raw";
import { Material } from "./material.js";
import { Light } from "./light.js";

const MAX_OBJECTS = 1000;
const OBJECT_STRIDE = 80; // mat4 (64) + vec4 color (16)

export class IndirectRenderer {
  canvas: HTMLCanvasElement;

  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  context: GPUCanvasContext | null = null;
  format: GPUTextureFormat | null = null;

  // Unified mesh storage
  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;
  meshes: {
    vertexOffset: number;
    indexOffset: number;
    indexCount: number;
  }[] = [];

  // Indirect rendering buffers
  indirectBuffer: GPUBuffer | null = null;
  objectsBuffer: GPUBuffer | null = null;
  visibleIndicesBuffer: GPUBuffer | null = null;
  uniformBuffer: GPUBuffer | null = null;

  // Pipelines
  computePipeline: GPUComputePipeline | null = null;
  renderPipeline: GPURenderPipeline | null = null;

  // Bind groups
  computeFrameBindGroup: GPUBindGroup | null = null;
  computeSceneBindGroup: GPUBindGroup | null = null;
  renderFrameBindGroup: GPUBindGroup | null = null;
  renderSceneBindGroup: GPUBindGroup | null = null;

  // Depth
  depthTexture: GPUTexture | null = null;

  // Scene data
  lights: Light[] = [];

  ready: boolean = false;

  private readonly SCENE_BUFFER_SIZE = 352;
  private readonly MAX_LIGHTS = 8;
  private readonly MAX_VERTICES = 1000000;
  private readonly MAX_INDICES = 1000000;

  private currentVertexOffset = 0;
  private currentIndexOffset = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize() {
    if (!navigator.gpu)
      throw new Error("WebGPU not supported on this browser.");

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) throw new Error("No suitable GPU adapter found.");

    this.device = await this.adapter.requestDevice();

    this.device.addEventListener("uncapturederror", (event) => {
      console.error("WebGPU uncaptured error:", event.error);
    });

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;
    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });

    this.depthTexture = this.device.createTexture({
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    await Promise.all([this.createAssets(), this.createPipelines()]);
    this.ready = true;
  }

  private async createAssets() {
    if (!this.device) return;

    // Unified vertex buffer for all meshes
    this.vertexBuffer = this.device.createBuffer({
      label: "Unified vertex buffer",
      size: this.MAX_VERTICES * 10 * 4, // 10 floats per vertex
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    // Unified index buffer for all meshes
    this.indexBuffer = this.device.createBuffer({
      label: "Unified index buffer",
      size: this.MAX_INDICES * 2, // Uint16
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    // Indirect draw buffer
    this.indirectBuffer = this.device.createBuffer({
      label: "Indirect draw buffer",
      size: 5 * 4, // indexCount, instanceCount, firstIndex, baseVertex, firstInstance
      usage:
        GPUBufferUsage.INDIRECT |
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST,
    });

    // All objects buffer (transforms + colors)
    this.objectsBuffer = this.device.createBuffer({
      label: "Objects buffer",
      size: MAX_OBJECTS * OBJECT_STRIDE,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Visible indices buffer
    this.visibleIndicesBuffer = this.device.createBuffer({
      label: "Visible indices buffer",
      size: MAX_OBJECTS * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Uniform buffer (view-projection, camera, lights)
    this.uniformBuffer = this.device.createBuffer({
      label: "Scene uniforms",
      size: this.SCENE_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createPipelines() {
    if (!this.device) return;

    const shaderModule = this.device.createShaderModule({
      code: shader,
      label: "Indirect shader module",
    });

    // Get compilation info to check for errors
    const compilationInfo = await shaderModule.getCompilationInfo();
    if (compilationInfo.messages.length > 0) {
      console.error("Shader compilation messages:");
      compilationInfo.messages.forEach((msg) => {
        console.error(`  ${msg.type}: ${msg.message} at line ${msg.lineNum}`);
      });
    }

    // Create pipelines with auto layout (they will generate compatible layouts)
    try {
      this.computePipeline = this.device.createComputePipeline({
        label: "Culling compute pipeline",
        layout: "auto",
        compute: {
          module: shaderModule,
          entryPoint: "main",
        },
      });
    } catch (error) {
      console.error("Failed to create compute pipeline:", error);
      throw error;
    }

    try {
      this.renderPipeline = this.device.createRenderPipeline({
        label: "Indirect render pipeline",
        layout: "auto",
        vertex: {
          module: shaderModule,
          entryPoint: "vs_main",
          buffers: [
            {
              arrayStride: 10 * 4,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
                { shaderLocation: 1, offset: 12, format: "float32x3" },
                { shaderLocation: 2, offset: 24, format: "float32x4" },
              ],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_main",
          targets: [{ format: this.format! }],
        },
        primitive: {
          topology: "triangle-list",
          cullMode: "back",
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: "less",
          format: "depth24plus",
        },
      });
    } catch (error) {
      console.error("Failed to create render pipeline:", error);
      throw error;
    }

    // Ensure pipelines are valid before creating bind groups
    if (!this.computePipeline || !this.renderPipeline) {
      throw new Error("Failed to create pipelines");
    }

    // Create bind groups for compute pipeline
    this.computeFrameBindGroup = this.device.createBindGroup({
      label: "Compute frame bind group",
      layout: this.computePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer! },
        },
      ],
    });

    this.computeSceneBindGroup = this.device.createBindGroup({
      label: "Compute scene bind group",
      layout: this.computePipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.objectsBuffer! },
        },
        {
          binding: 1,
          resource: { buffer: this.visibleIndicesBuffer! },
        },
        {
          binding: 2,
          resource: { buffer: this.indirectBuffer! },
        },
      ],
    });

    // Create bind groups for render pipeline
    this.renderFrameBindGroup = this.device.createBindGroup({
      label: "Render frame bind group",
      layout: this.renderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer! },
        },
      ],
    });

    this.renderSceneBindGroup = this.device.createBindGroup({
      label: "Render scene bind group",
      layout: this.renderPipeline.getBindGroupLayout(1),
      entries: [
        {
          binding: 0,
          resource: { buffer: this.objectsBuffer! },
        },
        {
          binding: 1,
          resource: { buffer: this.visibleIndicesBuffer! },
        },
      ],
    });
  }

  uploadMesh(vertices: Float32Array, indices: Uint16Array): number | null {
    if (!this.device) return null;

    const vertexByteSize = vertices.byteLength;
    const indexByteSize = indices.byteLength;

    // Check if we have space
    if (
      this.currentVertexOffset + vertexByteSize > this.MAX_VERTICES * 10 * 4 ||
      this.currentIndexOffset + indexByteSize > this.MAX_INDICES * 2
    ) {
      console.error("Mesh buffer overflow");
      return null;
    }

    // Write to unified buffers
    this.device.queue.writeBuffer(
      this.vertexBuffer!,
      this.currentVertexOffset,
      vertices,
    );
    this.device.queue.writeBuffer(
      this.indexBuffer!,
      this.currentIndexOffset,
      indices,
    );

    const meshId = this.meshes.push({
      vertexOffset: this.currentVertexOffset / (10 * 4), // vertex index
      indexOffset: this.currentIndexOffset / 2, // index count
      indexCount: indices.length,
    });

    this.currentVertexOffset += vertexByteSize;
    this.currentIndexOffset += indexByteSize;

    return meshId;
  }

  async render(
    entities: {
      meshId: number;
      position: Vec3;
      rotation: Vec3;
      scale: Vec3;
      matrix: Mat4;
    }[],
    cameraPosition: Vec3,
    projectionMatrix: Mat4,
    material: Material,
  ) {
    if (!this.device || entities.length === 0) return;

    const viewProjection = projectionMatrix;

    // Update uniform buffer (scene data)
    const sceneData = new Float32Array(16 + 4 + 4 + this.MAX_LIGHTS * 8);
    sceneData.set(viewProjection, 0);
    sceneData.set([...cameraPosition, 0], 16);

    const lightCountView = new Uint32Array(sceneData.buffer, 80, 1);
    lightCountView[0] = this.lights.length;

    let offset = 24;
    this.lights.forEach((light) => {
      sceneData.set([...light.position, light.range], offset);
      sceneData.set([...light.color, light.intensity], offset + 4);
      offset += 8;
    });

    this.device.queue.writeBuffer(this.uniformBuffer!, 0, sceneData);

    // Update objects buffer (transforms + colors)
    const objectsData = new Float32Array(entities.length * (OBJECT_STRIDE / 4));
    entities.forEach((entity, i) => {
      const baseOffset = i * (OBJECT_STRIDE / 4);
      objectsData.set(entity.matrix, baseOffset); // mat4 (16 floats)
      objectsData.set(material.color, baseOffset + 16); // vec4 (4 floats)
    });

    this.device.queue.writeBuffer(this.objectsBuffer!, 0, objectsData);

    // Reset indirect buffer
    const mesh = this.meshes[entities[0].meshId - 1];
    const resetData = new Uint32Array([
      mesh.indexCount,
      0,
      mesh.indexOffset,
      mesh.vertexOffset,
      0,
    ]);
    this.device.queue.writeBuffer(this.indirectBuffer!, 0, resetData);

    const commandEncoder = this.device.createCommandEncoder();

    // Compute pass (culling)
    const computePass = commandEncoder.beginComputePass();
    if (!this.computePipeline) {
      console.error("Compute pipeline is null!");
      return;
    }
    computePass.setPipeline(this.computePipeline);
    computePass.setBindGroup(0, this.computeFrameBindGroup!);
    computePass.setBindGroup(1, this.computeSceneBindGroup!);
    computePass.dispatchWorkgroups(Math.ceil(entities.length / 64));
    computePass.end();

    // Render pass
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context!.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    renderPass.setPipeline(this.renderPipeline!);
    renderPass.setBindGroup(0, this.renderFrameBindGroup!);
    renderPass.setBindGroup(1, this.renderSceneBindGroup!);

    renderPass.setVertexBuffer(0, this.vertexBuffer!);
    renderPass.setIndexBuffer(this.indexBuffer!, "uint16");

    renderPass.drawIndexedIndirect(this.indirectBuffer!, 0);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
