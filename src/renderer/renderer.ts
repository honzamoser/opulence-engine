import { Mat4, mat4, Vec3, vec3 } from "wgpu-matrix";
import { Mesh } from "./mesh.js";
import { Entity } from "../entity.js";
import { Light } from "./light.js";
import { TransformComponent } from "../ecs/components/transform.js";
import { Material } from "./material.js";

export class Renderer {
  canvas: HTMLCanvasElement;

  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  context: GPUCanvasContext | null = null;
  format: GPUTextureFormat | null = null;

  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;

  vertexLayout: GPUVertexBufferLayout | null = null;

  sceneBuffer: GPUBuffer | null = null;
  sceneLayout: GPUBindGroupLayout | null = null;
  sceneBindGroup: GPUBindGroup | null = null;

  objectBuffer: GPUBuffer | null = null;
  objectBindGroup: GPUBindGroup | null = null;

  depthTexture: GPUTexture | null = null;

  lights: Light[] = [];

  ready: boolean = false;

  private readonly UNIFORM_COUNT = 1024;
  private readonly MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT = 256;
  private readonly SCENE_BUFFER_SIZE = 352;
  private readonly MAX_LIGHTS = 8;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialize() {
    if (!navigator.gpu)
      throw new Error("WebGPU not supported on this browser.");

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) throw new Error("No suitable GPU adapter found.");

    this.device = await this.adapter.requestDevice();
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

    await Promise.all([this.createAssets(), this.createPipeline()]);
    this.ready = true;
  }

  private async createAssets() {
    if (!this.device) return;

    this.sceneBuffer = this.device.createBuffer({
      label: "Scene uniforms",
      size: this.SCENE_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.objectBuffer = this.device.createBuffer({
      label: "Object uniforms",
      size: this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT * this.UNIFORM_COUNT,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  private async createPipeline() {
    if (!this.device) return;

    this.vertexLayout = {
      arrayStride: 10 * 4,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x3" },
        { shaderLocation: 1, offset: 12, format: "float32x3" },
        { shaderLocation: 2, offset: 24, format: "float32x4" },
      ],
    };

    this.sceneLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
      ],
    });

    const objectLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: 64,
          },
        },
      ],
    });

    this.sceneBindGroup = this.device.createBindGroup({
      layout: this.sceneLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.sceneBuffer },
        },
      ],
    });

    this.objectBindGroup = this.device.createBindGroup({
      layout: objectLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.objectBuffer!,
            offset: 0,
            size: this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT,
          },
        },
      ],
    });
  }

  async render(
    entities: {
      entity: Entity;
      mesh: Mesh;
      transform: TransformComponent;
      material: Material;
    }[],
    time: number,
    cameraPosition: Vec3,
    projectionMatrix: Mat4,
  ) {
    const viewProjection = projectionMatrix;

    const sceneData = new Float32Array(16 + 4 + 4 + this.MAX_LIGHTS * 8);

    sceneData.set(viewProjection, 0);
    sceneData.set([...cameraPosition, 0], 16);

    // write lights.length as UInt32
    const lightCountView = new Uint32Array(sceneData.buffer, 80, 1);
    lightCountView[0] = this.lights.length;

    let offset = 24;
    this.lights.forEach((light, i) => {
      sceneData.set([...light.position, light.range], offset);
      sceneData.set([...light.color, light.intensity], offset + 4);
      offset += 8;
    });

    this.device!.queue.writeBuffer(this.sceneBuffer!, 0, sceneData);

    // Sort entities by material to batch draw calls
    entities.sort((a, b) => {
      return a.material.id - b.material.id;
    });

    // Group entities by material and write their data to material buffers
    const materialBatches = new Map<
      number,
      { material: Material; entities: typeof entities }
    >();

    entities.forEach((entity) => {
      const materialId = entity.material.id;
      if (!materialBatches.has(materialId)) {
        materialBatches.set(materialId, {
          material: entity.material,
          entities: [],
        });
      }
      materialBatches.get(materialId)!.entities.push(entity);
    });

    // Write object data to each material's buffer
    materialBatches.forEach((batch) => {
      const bufferData = new Float32Array(
        (batch.entities.length * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) /
          4,
      );

      batch.entities.forEach((entity, i) => {
        const model = entity.transform.matrix;
        const color = batch.material.color;

        const offsetInFloats =
          (i * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) / 4;

        // Write color (vec4)
        bufferData.set(color, offsetInFloats);

        // Write model matrix (mat4)
        bufferData.set(model, offsetInFloats + 4);
      });

      this.device.queue.writeBuffer(
        batch.material.uniformBuffer!,
        0,
        bufferData,
      );
    });

    const commandEncoder = this.device!.createCommandEncoder();
    const textureView = this.context!.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
        },
      ],

      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    // Render each material batch
    materialBatches.forEach((batch) => {
      renderPass.setPipeline(batch.material.shader.pipeline!);
      renderPass.setBindGroup(0, this.sceneBindGroup!);

      batch.entities.forEach((entity, index) => {
        // Calculate dynamic offset for this object
        const dynamicOffset =
          index * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT;

        // Set bind group with dynamic offset
        renderPass.setBindGroup(1, batch.material.bindGroup, [dynamicOffset]);

        renderPass.setVertexBuffer(0, entity.mesh.vertexBuffer!);
        renderPass.setIndexBuffer(entity.mesh.indexBuffer!, "uint16");
        renderPass.drawIndexed(entity.mesh.indexCount);
      });
    });

    renderPass.end();
    this.device!.queue.submit([commandEncoder.finish()]);
  }
}
