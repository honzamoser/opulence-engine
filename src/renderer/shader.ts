import { Renderer } from "./renderer";

export class Shader {
  pipeline: GPURenderPipeline;
  bindGroupLayout: GPUBindGroupLayout;
  renderer: Renderer;

  shaderCode: string;
  label: string;

  initialized: boolean = false;

  constructor(renderer: Renderer, shaderCode: string, label: string) {
    this.renderer = renderer;
    this.shaderCode = shaderCode;
    this.label = label;
  }

  start() {
    const module = this.renderer.device.createShaderModule({
      code: this.shaderCode,
      label: `${this.label} Shader Module`,
    });

    this.bindGroupLayout = this.renderer.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: {
            type: "uniform",
            hasDynamicOffset: true,
            minBindingSize: 80,
          },
        },
      ],
      label: `${this.label} Bind Group Layout`,
    });

    this.pipeline = this.renderer.device.createRenderPipeline({
      label: this.label,
      layout: this.renderer.device.createPipelineLayout({
        bindGroupLayouts: [this.renderer.sceneLayout, this.bindGroupLayout],
      }),
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [this.renderer.vertexLayout],
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format: this.renderer.format }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });

    this.initialized = true;
  }
}
