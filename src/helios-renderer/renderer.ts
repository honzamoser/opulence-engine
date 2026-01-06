import { Mat4, vec4, Vec4 } from "wgpu-matrix";
import opuleneceConfig from "../../opulenece.config";
import { WGSL_debug } from "wgsl-debug";

interface GlobalLayout {
  viewProj: Mat4;
  frustrumPlanes: Array<Vec4>;
}

interface SceneLayout {
  objects: Array<{
    model: Mat4;
    meshId: number;
    localRadius: number;
  }>;
}

interface ComputeLayout {
  visible_indices_write: Uint32Array;
  draw_commands: Array<{
    vertexCount: number;
    instanceCount: number;
    firstIndex: number;
    baseVertex: number;
    firstInstance: number;
  }>;
}

interface VertexLayout {
  visible_indices_read: number[];
}

export type RenderContext = {
  device: GPUDevice;
  commandEncoder: GPUCommandEncoder;
  context: HeliosRenderer;
  resources: HeliosResourceManager;
  outputView: GPUTextureView;
};

export interface RenderPass {
  name: string;

  inputs: string[];
  outputs: string[];

  init(
    device: GPUDevice,
    world: HeliosRenderer,
    format: GPUTextureFormat,
  ): Promise<void>;
  execute(context: RenderContext): void;
}

export class HeliosFrameGraph {
  private passes: RenderPass[] = [];
  private resources = new HeliosResourceManager();

  addPass(pass: RenderPass) {
    this.passes.push(pass);
  }

  async init(
    device: GPUDevice,
    world: HeliosRenderer,
    format: GPUTextureFormat,
  ) {
    for (const pass of this.passes) {
      pass.init(device, world, format);
    }
  }

  execute(
    device: GPUDevice,
    state: HeliosRenderer,
    outputView: GPUTextureView,
    width: number,
    height: number,
  ) {
    const encoder = device.createCommandEncoder();

    this.resources.prepareDepthTexture(device, width, height);

    const ctx: RenderContext = {
      device,
      commandEncoder: encoder,
      context: state,
      resources: this.resources,
      outputView,
    };

    for (const pass of this.passes) {
      pass.execute(ctx);
    }

    device.queue.submit([encoder.finish()]);
  }
}

export class HeliosResourceManager {
  depthTexture: GPUTexture | null = null;
  depthView: GPUTextureView | null = null;

  prepareDepthTexture(device: GPUDevice, width: number, height: number) {
    if (
      !this.depthTexture ||
      this.depthTexture.width != width ||
      this.depthTexture.height != height
    ) {
      if (this.depthTexture) this.depthTexture.destroy();

      this.depthTexture = device.createTexture({
        size: [width, height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.depthView = this.depthTexture.createView();
    }

    return this.depthView!;
  }
}

export class HeliosRenderer {
  spawn(
    mesh: { indexCount: number; firstIndex: number; baseVertex: number },
    matrix: Float32Array<ArrayBufferLike>,
  ) {
    const instanceData = new Float32Array(20);
    instanceData.set(matrix, 0); // 16 floats for model matrix
    instanceData.set(vec4.create(1, 0.2, 0.2, 1), 16);

    const offset = this.meshRegistry.size * 80; // 80 bytes per instance
    this.device.queue.writeBuffer(this.instanceBuffer, offset, instanceData);

    const indirectData = new Uint32Array([
      mesh.indexCount,
      1, // instanceCount
      mesh.firstIndex,
      this.meshRegistry.size, // firstInstance
    ]);

    console.log(indirectData);

    this.device.queue.writeBuffer(
      this.indirectBuffer,
      this.meshRegistry.size * 16, // 20 bytes per indirect command
      indirectData,
    );

    return this.meshRegistry.size - 1; // Return meshId
  }
  resources: HeliosResourceManager;
  canvas: HTMLCanvasElement;

  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;

  instanceBuffer: GPUBuffer;
  indirectBuffer: GPUBuffer;

  visibleIndicesBuffer: GPUBuffer;
  uniformBuffer: GPUBuffer;

  bindGroupGlobal: GPUBindGroup;
  bindGroupScene: GPUBindGroup;
  bindGroupCompute: GPUBindGroup;
  bindGroupVertex: GPUBindGroup;

  layoutGlobal: GPUBindGroupLayout;
  layoutScene: GPUBindGroupLayout;
  layoutCompute: GPUBindGroupLayout;
  layoutVertex: GPUBindGroupLayout;

  graph: HeliosFrameGraph;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.resources = new HeliosResourceManager();

    this.graph = new HeliosFrameGraph();
  }

  vOffset = 0;
  iOffset = 0;

  public meshRegistry: Map<
    string,
    { indexCount: number; firstIndex: number; baseVertex: number }
  > = new Map();

  public uploadMesh(
    name: string,
    vertices: Float32Array,
    indices: Uint32Array,
  ) {
    const vertexStride = 3;

    const baseVertex = this.vOffset / vertexStride;
    const firstIndex = this.iOffset;
    const indexCount = indices.length;

    this.device.queue.writeBuffer(
      this.vertexBuffer,
      this.vOffset * 4,
      vertices,
    );

    this.device.queue.writeBuffer(this.indexBuffer, this.iOffset * 4, indices);

    this.vOffset += vertices.length;
    this.iOffset += indices.length;

    // TODO: Padding
    //

    this.meshRegistry.set(name, { indexCount, firstIndex, baseVertex });

    console.log(
      `Uploaded Mesh ${name}: ${indexCount} indices, BaseVertex: ${baseVertex}`,
    );

    return { indexCount, firstIndex, baseVertex };
  }

  public async initialize() {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }

    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) throw new Error("No suitable GPU adapter found.");

    this.device = await this.adapter.requestDevice({
      requiredFeatures: ["chromium-experimental-multi-draw-indirect"],
    });

    // Add error handling for uncaptured errors
    this.device.addEventListener("uncapturederror", (event) => {
      // console.error("WebGPU uncaptured error:", event.error);
    });

    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "premultiplied",
    });

    this.initialize_buffers();
    this.initialize_bindGroups();

    this.graph.init(this.device, this, this.format);
  }

  private initialize_bindGroups() {
    this.layoutGlobal = this.device.createBindGroupLayout({
      label: "LAYOUT_GLOBAL",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
      ],
    });

    this.bindGroupGlobal = this.device.createBindGroup({
      label: "BINDGROUP_GLOBAL",
      layout: this.layoutGlobal,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });

    // READ ONLY for Vertex + Compute
    this.layoutScene = this.device.createBindGroupLayout({
      label: "LAYOUT_SCENE",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
          buffer: { type: "read-only-storage" },
        },
      ],
    });

    this.bindGroupScene = this.device.createBindGroup({
      label: "BINDGROUP_SCENE",
      layout: this.layoutScene,
      entries: [{ binding: 0, resource: { buffer: this.instanceBuffer } }],
    });

    // COMPUTE LAYOUT

    this.layoutCompute = this.device.createBindGroupLayout({
      label: "LAYOUT_COMPUTE",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: "storage" },
        },
      ],
    });

    this.bindGroupCompute = this.device.createBindGroup({
      label: "BINDGROUP_WRITE",
      layout: this.layoutCompute,
      entries: [
        { binding: 0, resource: { buffer: this.visibleIndicesBuffer } },
        { binding: 1, resource: { buffer: this.indirectBuffer } },
      ],
    });

    this.layoutVertex = this.device.createBindGroupLayout({
      label: "LAYOUT_VERTEX",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });
    this.bindGroupVertex = this.device.createBindGroup({
      label: "BINDGROUP_VERTEX",
      layout: this.layoutVertex,
      entries: [
        { binding: 0, resource: { buffer: this.visibleIndicesBuffer } },
      ],
    });
  }

  private initialize_buffers() {
    this.vertexBuffer = this.device.createBuffer({
      label: "BUFFER_VERTEX",
      size: opulence_config.render.meshPage,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.indexBuffer = this.device.createBuffer({
      label: "BUFFER_INDEX",
      size: opulence_config.render.meshPage,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });

    this.instanceBuffer = this.device.createBuffer({
      label: "BUFFER_INSTANCE",
      size: opulence_config.render.maxMeshes * 80, // Assuming 80 bytes per instance
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Indirect: [indexCount, instanceCount, firstIndex, baseVertex, firstInstance]
    this.indirectBuffer = this.device.createBuffer({
      label: "BUFFER_INDIRECT",
      size: 20 * 1000, // Mesh types
      usage:
        GPUBufferUsage.INDIRECT |
        GPUBufferUsage.STORAGE |
        GPUBufferUsage.COPY_DST,
    });

    this.visibleIndicesBuffer = this.device.createBuffer({
      label: "BUFFER_VISIBLE_INDICES",
      size: opulence_config.render.maxMeshes * 4, // Assuming 4 bytes per index
      usage: GPUBufferUsage.STORAGE,
    });

    this.uniformBuffer = this.device.createBuffer({
      label: "BUFFER_UNIFORM",
      size: 256,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  }

  render() {
    this.graph.execute(
      this.device,
      this,
      this.context.getCurrentTexture().createView(),
      this.canvas.width,
      this.canvas.height,
    );
  }
}

export class LinearAllocator {}
