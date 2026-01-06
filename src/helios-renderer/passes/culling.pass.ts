import {
  HeliosRenderer,
  HeliosState,
  RenderContext,
  RenderPass,
} from "../renderer";
import WGSL_SHADER_SOURCE from "../../../resources/shaders/helios/indirect.wgsl?raw";

export class CullingPass implements RenderPass {
  name: "GPU Culling";

  pipeline!: GPUComputePipeline;

  async init(
    device: GPUDevice,
    world: HeliosRenderer,
    format: GPUTextureFormat,
  ) {
    const module = device.createShaderModule({ code: WGSL_SHADER_SOURCE });
    this.pipeline = device.createComputePipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          world.layoutGlobal,
          world.layoutScene,
          world.layoutCompute,
        ],
      }),
      compute: { module, entryPoint: "cull_main" },
    });
  }

  execute(context: RenderContext): void {
    const pass = context.commandEncoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, context.context.bindGroupGlobal);
    pass.setBindGroup(1, context.context.bindGroupScene);
    pass.setBindGroup(2, context.context.bindGroupCompute);

    pass.dispatchWorkgroups(Math.ceil(opulence_config.render.maxMeshes / 64));
    pass.end();
  }
}
