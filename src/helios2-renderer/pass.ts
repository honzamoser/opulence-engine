import { Helios2_Buffers } from "./renderer";

export interface RenderPass {
  name: string;

  initialize(device: GPUDevice, buffers: Helios2_Buffers): void;
}
