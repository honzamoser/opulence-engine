import { BaseRenderer } from "./renderer";
import { Matrix4 } from "../types/matrix4";
import { Entity } from "../entity";
import { Texture } from "../components/texture";
import { Model3D } from "../components/model3d";
import { Vector2 } from "../types/vector2";

export class Renderer3D extends BaseRenderer {
    adapter: GPUAdapter | null = null;
    device: GPUDevice | null = null;
    context: GPUCanvasContext | null = null;
    canvasConfig: GPUCanvasConfiguration | null = null;

    depthTexture: GPUTexture | null = null;
    pipeline: GPURenderPipeline | null = null;
    projectionViewBuffer: GPUBuffer | null = null;
    projectionViewBindGroup: GPUBindGroup | null = null;
    modelBuffer: GPUBuffer | null = null;
    modelBindGroupLayout: GPUBindGroupLayout | null = null;
    textureBindGroupLayout: GPUBindGroupLayout | null = null;

    quadBuffer: GPUBuffer | null = null;
    indexBuffer: GPUBuffer | null = null;

    async initialize(canvas: HTMLCanvasElement) {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error("WebGPU not supported");
        const device = await adapter.requestDevice();
        if (!device) throw new Error("Failed to request GPU device");

        const context = canvas.getContext("webgpu") as GPUCanvasContext;
        if (!context) throw new Error("Failed to get WebGPU canvas context");

        const format = navigator.gpu.getPreferredCanvasFormat();
        const canvasConfig: GPUCanvasConfiguration = { device, format, alphaMode: "opaque" };
        context.configure(canvasConfig);

        this.adapter = adapter;
        this.device = device;
        this.context = context;
        this.canvasConfig = canvasConfig;

        this.createDepthTexture();
        this.createBuffers();
        this.createPipeline();
        this.createUniforms();
    }

    createDepthTexture() {
        if (!this.device || !this.context) return;
        const canvas = this.context.canvas as HTMLCanvasElement;
        this.depthTexture = this.device.createTexture({
            size: { width: canvas.width, height: canvas.height },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        });
    }

    createBuffers() {
        if (!this.device) return;

        // Quad (X,Z plane) centered at origin, Y up. We use positions (x,y,z), uv
        const vertices = new Float32Array([
            // x, y, z,    u, v
            -0.5, 0.0, -0.5, 0.0, 0.0,
            -0.5, 0.0,  0.5, 0.0, 1.0,
             0.5, 0.0,  0.5, 1.0, 1.0,
             0.5, 0.0, -0.5, 1.0, 0.0,
        ]);
        const indices = new Uint16Array([0,1,2, 0,2,3]);

        this.quadBuffer = this.device.createBuffer({ size: vertices.byteLength, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true });
        new Float32Array(this.quadBuffer.getMappedRange()).set(vertices);
        this.quadBuffer.unmap();

        this.indexBuffer = this.device.createBuffer({ size: indices.byteLength, usage: GPUBufferUsage.INDEX, mappedAtCreation: true });
        new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
        this.indexBuffer.unmap();
    }

    createUniforms() {
        if (!this.device) return;

        this.projectionViewBuffer = this.device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

        const modelSize = 256; // alignment
        this.modelBuffer = this.device.createBuffer({ size: modelSize * 100, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });

        // Bind group layouts
        this.modelBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform', hasDynamicOffset: true } }]
        });

        this.textureBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} }
            ]
        });

        const globalBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }]
        });

        this.projectionViewBindGroup = this.device.createBindGroup({ layout: globalBindGroupLayout, entries: [{ binding: 0, resource: { buffer: this.projectionViewBuffer } }] });
    }

    createPipeline() {
        if (!this.device || !this.canvasConfig) return;

        const shaderCode = `
struct Globals { projectionView: mat4x4<f32>; };
struct Model { model: mat4x4<f32>; };

@group(0) @binding(0) var<uniform> globals: Globals;
@group(1) @binding(0) var<uniform> model: Model;
@group(2) @binding(0) var mySampler: sampler;
@group(2) @binding(1) var myTexture: texture_2d<f32>;

struct VertexInput { @location(0) position: vec3<f32>; @location(1) uv: vec2<f32>; };
struct VertexOutput { @builtin(position) Position: vec4<f32>; @location(0) uv: vec2<f32>; @location(1) worldPos: vec3<f32>; };

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    let world = model.model * vec4<f32>(in.position, 1.0);
    out.Position = globals.projectionView * world;
    out.uv = in.uv;
    out.worldPos = world.xyz;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let albedo = textureSample(myTexture, mySampler, in.uv);
    // simple ambient + directional light
    let lightDir = normalize(vec3<f32>(0.5, -1.0, 0.3));
    let n = vec3<f32>(0.0, 1.0, 0.0); // flat normal for quads on XZ plane
    let diff = max(dot(n, -lightDir), 0.0);
    let color = albedo * (0.2 + 0.8 * diff);
    return color;
}
`;

        const module = this.device.createShaderModule({ code: shaderCode });

        const pipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [
            this.device.createBindGroupLayout({ entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } }] }),
            this.modelBindGroupLayout!,
            this.textureBindGroupLayout!
        ] });

        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 5 * 4,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'float32x2' }
                    ]
                }]
            },
            fragment: {
                module,
                entryPoint: 'fs_main',
                targets: [{ format: this.canvasConfig.format }]
            },
            primitive: { topology: 'triangle-list', cullMode: 'back' },
            depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' }
        });
    }

    updateProjectionView(matrix: Matrix4) {
        if (!this.device || !this.projectionViewBuffer) return;
        this.device.queue.writeBuffer(this.projectionViewBuffer, 0, matrix.values as unknown as ArrayBuffer);
    }

    render(instances: { model: Matrix4, textureBindGroup: GPUBindGroup }[]) {
        if (!this.device || !this.context || !this.pipeline || !this.quadBuffer || !this.indexBuffer || !this.projectionViewBindGroup || !this.modelBindGroupLayout || !this.textureBindGroupLayout || !this.modelBuffer || !this.depthTexture) return;

        const commandEncoder = this.device.createCommandEncoder();
        const colorView = this.context.getCurrentTexture().createView();

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [{ view: colorView, loadOp: 'clear', storeOp: 'store', clearValue: { r: 0.05, g: 0.05, b: 0.05, a: 1 } }],
            depthStencilAttachment: { view: this.depthTexture.createView(), depthLoadOp: 'clear', depthClearValue: 1.0, depthStoreOp: 'store' }
        };

        const pass = commandEncoder.beginRenderPass(renderPassDesc);
        pass.setPipeline(this.pipeline);
        pass.setVertexBuffer(0, this.quadBuffer);
        pass.setIndexBuffer(this.indexBuffer, 'uint16');
        pass.setBindGroup(0, this.projectionViewBindGroup!);

        const alignedSize = 256;
        for (let i = 0; i < instances.length; i++) {
            const off = i * alignedSize;
            this.device.queue.writeBuffer(this.modelBuffer, off, instances[i].model.values as unknown as ArrayBuffer);
            const modelBindGroup = this.device.createBindGroup({ layout: this.modelBindGroupLayout!, entries: [{ binding: 0, resource: { buffer: this.modelBuffer, size: 64, offset: off } }] });

            pass.setBindGroup(1, modelBindGroup, [off]);
            pass.setBindGroup(2, instances[i].textureBindGroup);
            pass.drawIndexed(6, 1, 0, 0, 0);
        }

        pass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    renderEntities(entities: Entity[], cameraPosition?: Vector2): void {
        if (!this.device || !this.textureBindGroupLayout) return;

        const quadInstances: { model: Matrix4, textureBindGroup: GPUBindGroup }[] = [];
        const meshInstances: { model: Matrix4, modelComponent: Model3D, textureBindGroup?: GPUBindGroup }[] = [];

        for (const e of entities) {
            const modelComp = e.components.find(c => c instanceof Model3D) as Model3D | undefined;
            const tex = e.components.find(c => c instanceof Texture) as Texture | undefined;

            // prepare texture bind group if texture exists
            if (tex && !tex.bindGroup && this.device) {
                tex.bindGroup = this.device.createBindGroup({
                    layout: this.textureBindGroupLayout!,
                    entries: [
                        { binding: 0, resource: tex.sampler! },
                        { binding: 1, resource: tex.view! }
                    ]
                });
            }

            // model3D rendering path
            if (modelComp && modelComp.positionBuffer) {
                let model = Matrix4.identity();
                model = model.multiply(Matrix4.translation(e.position.x, 0, e.position.y));
                model = model.multiply(Matrix4.rotationZ(e.rotation));
                model = model.multiply(Matrix4.scaling(e.scale.x, 1, e.scale.y));

                meshInstances.push({ model, modelComponent: modelComp, textureBindGroup: tex ? tex.bindGroup! : undefined });
                continue;
            }

            // fallback: quad sprite path
            if (tex && tex.view && tex.sampler) {
                let model = Matrix4.identity();
                model = model.multiply(Matrix4.translation(e.position.x, 0, e.position.y));
                model = model.multiply(Matrix4.rotationZ(e.rotation));
                model = model.multiply(Matrix4.scaling(e.scale.x, 1, e.scale.y));
                quadInstances.push({ model, textureBindGroup: tex.bindGroup! });
            }
        }

        // render quad instances using existing quad pipeline
        if (quadInstances.length > 0) this.render(quadInstances);

        // render mesh instances
        if (meshInstances.length > 0) {
            this.renderMeshes(meshInstances);
        }
    }

    renderMeshes(instances: { model: Matrix4, modelComponent: Model3D, textureBindGroup?: GPUBindGroup }[]) {
        if (!this.device || !this.context || !this.pipeline || !this.projectionViewBindGroup || !this.modelBindGroupLayout || !this.modelBuffer || !this.depthTexture) return;

        const commandEncoder = this.device.createCommandEncoder();
        const colorView = this.context.getCurrentTexture().createView();

        const renderPassDesc: GPURenderPassDescriptor = {
            colorAttachments: [{ view: colorView, loadOp: 'load', storeOp: 'store' }],
            depthStencilAttachment: { view: this.depthTexture.createView(), depthLoadOp: 'load', depthStoreOp: 'store' }
        };

        const pass = commandEncoder.beginRenderPass(renderPassDesc);
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.projectionViewBindGroup!);

        const alignedSize = 256;
        for (let i = 0; i < instances.length; i++) {
            const inst = instances[i];
            const comp = inst.modelComponent;
            const off = i * alignedSize;
            this.device.queue.writeBuffer(this.modelBuffer, off, inst.model.values as unknown as ArrayBuffer);
            const modelBindGroup = this.device.createBindGroup({ layout: this.modelBindGroupLayout!, entries: [{ binding: 0, resource: { buffer: this.modelBuffer, size: 64, offset: off } }] });

            pass.setBindGroup(1, modelBindGroup, [off]);

            // set vertex buffers from model component
            pass.setVertexBuffer(0, comp.positionBuffer!);
            if (comp.uvBuffer) pass.setVertexBuffer(1, comp.uvBuffer);
            if (comp.indexBuffer) pass.setIndexBuffer(comp.indexBuffer, comp.indexFormat);

            if (inst.textureBindGroup) pass.setBindGroup(2, inst.textureBindGroup);

            const indexCount = comp.indexCount || 0;
            if (indexCount > 0) {
                pass.drawIndexed(indexCount, 1, 0, 0, 0);
            } else {
                // fallback if no indices
                // assume positions length / 3
                const vertexCount = (comp.mesh?.positions.length || 0) / 3;
                pass.draw(vertexCount, 1, 0, 0);
            }
        }

        pass.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }
}

export default Renderer3D;