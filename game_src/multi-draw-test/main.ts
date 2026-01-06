async function render() {
  const adapter = await navigator.gpu.requestAdapter();

  if (!adapter.features.has("chromium-experimental-multi-draw-indirect")) {
    console.error(
      "Multi-draw indirect feature is not supported on this GPU adapter.",
    );
  }

  const device = await adapter.requestDevice({
    requiredFeatures: ["chromium-experimental-multi-draw-indirect"],
  });

  const canvas = document.getElementById("mainCanvas") as HTMLCanvasElement;
  const context = canvas.getContext("webgpu") as GPUCanvasContext;
  const format = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device: device,
    format: format,
    alphaMode: "premultiplied",
  });

  const drawData = new Uint32Array([6, 1, 0, 0]);

  const drawBuffer = device.createBuffer({
    size: 80,
    usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(drawBuffer, 0, drawData);

  // simple 2d quad
  const vertices = new Float32Array([
    -0.5,
    0.5,
    0.0, // TL
    0.5,
    0.5,
    0.0, // TR
    -0.5,
    -0.5,
    0.0, // BL
    0.5,
    -0.5,
    0.0, // BR
  ]);

  const indices = new Uint32Array([0, 1, 2, 3, 1, 2]);

  const vertexBuffer = device.createBuffer({
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
  vertexBuffer.unmap();

  const indexBuffer = device.createBuffer({
    size: indices.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    mappedAtCreation: true,
  });
  new Uint32Array(indexBuffer.getMappedRange()).set(indices);
  indexBuffer.unmap();

  const shaderModule = device.createShaderModule({
    code: `
    struct OurVertexShaderOutput {
            @builtin(position) position: vec4f,
            @location(0) color: vec4f,
          };

      @vertex
      fn vs_main(@location(0) position: vec3<f32>, @builtin(instance_index) ii: u32) -> OurVertexShaderOutput {
      var color = array<vec4f, 3>(
      vec4f(1.0, 0.0, f32(ii), 1.0),
      vec4f(0.0, 1.0, 0.0, 1.0),
      vec4f(0.0, 0.0, 1.0, 1.0)
      );

      var vsOutput: OurVertexShaderOutput;
      vsOutput.position = vec4f(position, 1.0);
      vsOutput.color = color[0];
      return vsOutput;
      }

      @fragment
      fn fs_main(fsInput: OurVertexShaderOutput) -> @location(0) vec4<f32> {
        return fsInput.color;
      }
    `,
  });

  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 12,
          attributes: [{ format: "float32x3", offset: 0, shaderLocation: 0 }],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_main",
      targets: [{ format: "bgra8unorm" }],
    },
    primitive: { topology: "triangle-list" },
  });

  function frame() {
    const commandEncoder = device.createCommandEncoder();

    const textureView = context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          loadOp: "clear",
          storeOp: "store",
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
        },
      ],
    });

    renderPass.setPipeline(pipeline);
    renderPass.setVertexBuffer(0, vertexBuffer);
    renderPass.setIndexBuffer(indexBuffer, "uint32");

    (renderPass as any).multiDrawIndexedIndirect(
      drawBuffer,
      0,
      1, // Execute Command 0 and Command 1
    );

    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

render();
