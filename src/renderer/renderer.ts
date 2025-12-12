import { mat4, Vec3, vec3 } from "wgpu-matrix";
import { Mesh } from "./mesh.js";
import { Entity } from "../entity.js";
import { Light } from "./light.js";

export class Renderer {
  getViewProjectionMatrix(cameraPosition: Vec3): Float32Array<ArrayBufferLike> {
    const aspect = this.canvas.width / this.canvas.height;
    const projection = mat4.perspective(Math.PI / 2, aspect, 0.1, 100);
    const view = mat4.lookAt(
      cameraPosition,
      vec3.create(0, 0, 0),
      vec3.create(0, 1, 0),
    );
    const viewProjection = mat4.multiply(projection, view);
    return viewProjection;
  }
  canvas: HTMLCanvasElement;
  shaderSource: string;

  adapter: GPUAdapter | null = null;
  device: GPUDevice | null = null;
  context: GPUCanvasContext | null = null;
  format: GPUTextureFormat | null = null;
  pipeline: GPURenderPipeline | null = null;

  vertexBuffer: GPUBuffer | null = null;
  indexBuffer: GPUBuffer | null = null;

  sceneBuffer: GPUBuffer | null = null;
  sceneBindGroup: GPUBindGroup | null = null;

  objectBuffer: GPUBuffer | null = null;
  objectBindGroup: GPUBindGroup | null = null;

  depthTexture: GPUTexture | null = null;

  lights: Light[] = [];

  private readonly UNIFORM_COUNT = 128;
  private readonly MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT = 256;
  private readonly SCENE_BUFFER_SIZE = 352;
  private readonly MAX_LIGHTS = 8;

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    this.canvas = canvas;
    this.shaderSource = shaderSource;
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

    this.createAssets();
    this.createPipeline();
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

    const shaderModule = this.device.createShaderModule({
      code: this.shaderSource,
    });

    const vertexLayout: GPUVertexBufferLayout = {
      arrayStride: 10 * 4,
      attributes: [
        { shaderLocation: 0, offset: 0, format: "float32x3" },
        { shaderLocation: 1, offset: 12, format: "float32x3" },
        { shaderLocation: 2, offset: 24, format: "float32x4" },
      ],
    };

    const sceneLayout = this.device.createBindGroupLayout({
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

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [sceneLayout, objectLayout],
      }),
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [vertexLayout],
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

    this.sceneBindGroup = this.device.createBindGroup({
      layout: sceneLayout,
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

  async render(entities: Entity[], time: number, cameraPosition: Vec3) {
    const viewProjection = this.getViewProjectionMatrix(cameraPosition);

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

    const projectionBuffer = new Float32Array(
      (entities.length * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) / 4,
    );
    entities.forEach((entity, i) => {
      const model = entity.transform;
      const mvp = mat4.multiply(viewProjection, entity.transform);
      // projectionBuffer.set(
      //   mvp as Float32Array,
      //   (i * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) / 4,
      // );

      projectionBuffer.set(
        model,
        (i * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) / 4,
      );
    });

    this.device.queue.writeBuffer(
      this.objectBuffer!,
      0,
      projectionBuffer,
      0,
      (entities.length * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT) / 4,
    );

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

    renderPass.setPipeline(this.pipeline!);
    renderPass.setBindGroup(0, this.sceneBindGroup!);

    for (const [i, entity] of entities.entries()) {
      const offset = i * this.MINUMUM_UNIFORM_BUFFER_OFFSET_ALIGNMENT;

      renderPass.setBindGroup(1, this.objectBindGroup!, [offset]);
      renderPass.setVertexBuffer(0, entity.mesh.vertexBuffer!);
      renderPass.setIndexBuffer(entity.mesh.indexBuffer!, "uint16");
      renderPass.drawIndexed(entity.mesh.indexCount);
    }

    renderPass.end();
    this.device!.queue.submit([commandEncoder.finish()]);
  }
}
