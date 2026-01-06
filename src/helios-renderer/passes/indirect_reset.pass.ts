import {
  HeliosRenderer,
  HeliosState,
  RenderContext,
  RenderPass,
} from "../renderer";

export class ResetPass implements RenderPass {
  name: string = "Reset Pass";

  init(
    device: GPUDevice,
    world: HeliosRenderer,
    format: GPUTextureFormat,
  ): Promise<void> {}

  execute(context: RenderContext) {
    context.commandEncoder.clearBuffer(context.context.indirectBuffer, 0, 20);
  }
}
