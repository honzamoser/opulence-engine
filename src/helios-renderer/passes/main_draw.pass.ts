import { HeliosRenderer, RenderContext, RenderPass } from "../renderer";
import WGSL_SHADER_SOURCE from "../../../resources/shaders/helios/indirect.wgsl?raw";

export class MainDrawPass implements RenderPass {
  name: "Main Render Pass";
  pipeline!: GPURenderPipeline;

  async init(
    device: GPUDevice,
    world: HeliosRenderer,
    format: GPUTextureFormat,
  ): Promise<void> {
    const module = device.createShaderModule({
      code: WGSL_SHADER_SOURCE,
    });

    this.pipeline = device.createRenderPipeline({
      layout: device.createPipelineLayout({
        bindGroupLayouts: [
          world.layoutGlobal,
          world.layoutScene,
          world.layoutVertex,
        ],
      }),
      vertex: {
        module,
        entryPoint: "vs_main",
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ format: "float32x3", offset: 0, shaderLocation: 0 }],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus",
      },
    });
  }

  execute(context: RenderContext): void {
    const pass = context.commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: context.outputView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: [0.3, 0.3, 0.3, 1],
        },
      ],
      depthStencilAttachment: {
        view: context.resources.depthView!,
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1.0,
      },
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, context.context.bindGroupGlobal);
    pass.setBindGroup(1, context.context.bindGroupScene);
    pass.setBindGroup(2, context.context.bindGroupVertex);
    pass.setVertexBuffer(0, context.context.vertexBuffer);
    pass.setIndexBuffer(context.context.indexBuffer, "uint32");

    // console.log("Drawing ", context.context.indirectBuffer);
    //
    // vertexCount, instanceCount, firstVertex, firstInstance
    (pass as any).multiDrawIndexedIndirect(
      context.context.indirectBuffer,
      0,
      1,
    );

    pass.end();
  }
}
