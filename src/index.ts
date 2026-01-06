/// <reference types="@webgpu/types" />

import opuleneceConfig from "../opulenece.config";

declare global {
  var opulence_config: typeof opuleneceConfig;
}
