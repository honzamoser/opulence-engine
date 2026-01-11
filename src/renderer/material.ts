import { vec4, Vec4 } from "wgpu-matrix";
import { Renderer } from "./renderer";
import { Shader } from "../renderer/shader";

export class Material {
  shader: Shader;
  uniformBuffer: GPUBuffer;
  renderer: Renderer;
  bindGroup: GPUBindGroup;
  id: number;
  color: Vec4;

  private readonly MAX_OBJECTS = 1024;
  private readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT = 256;

  constructor(
    renderer: Renderer,
    shader: Shader,
    id: number,
    color: [number, number, number, number],
  ) {
    this.renderer = renderer;
    this.shader = shader;
    this.color = vec4.fromValues(...color);
    this.id = id;
  }

  start() {
    if (!this.shader.initialized) {
      this.shader.start();
    }

    this.uniformBuffer = this.renderer.device.createBuffer({
      size: this.UNIFORM_BUFFER_OFFSET_ALIGNMENT * this.MAX_OBJECTS,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = this.renderer.device.createBindGroup({
      layout: this.shader.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
            offset: 0,
            size: this.UNIFORM_BUFFER_OFFSET_ALIGNMENT,
          },
        },
      ],
    });
  }
}
