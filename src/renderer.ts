
import { Entity } from "./entity";
import { Texture } from "./components/texture";
import { Matrix4 } from "./types/matrix4";
import { Vector2 } from "./types/vector2";

export class Renderer {
    adapter: GPUAdapter | null = null;
    device: GPUDevice | null = null;
    context: GPUCanvasContext | null = null;
    canvasConfig: GPUCanvasConfiguration | null = null;

    spritePipeline: GPURenderPipeline | null = null;
    spriteBindGroupLayout: GPUBindGroupLayout | null = null;
    quadBuffer: GPUBuffer | null = null;
    indexBuffer: GPUBuffer | null = null;
    projectionMatrix: Matrix4 = Matrix4.identity();
    projectionBuffer: GPUBuffer | null = null;
    projectionBindGroup: GPUBindGroup | null = null;

    public async initializeWebGpu(canvas: HTMLCanvasElement) {
        const adapter = await navigator.gpu.requestAdapter();

        if (!adapter) {
            throw new Error("WebGPU is not supported on this browser.");
        }

        const device = await adapter.requestDevice();

        if (!device) {
            throw new Error("Failed to acquire GPU device.");
        }

        const context = canvas.getContext("webgpu") as GPUCanvasContext;

        if (!context) {
            throw new Error("Failed to get WebGPU context from canvas.");
        }

        const canvasConfig: GPUCanvasConfiguration = {
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat() as GPUTextureFormat,
            alphaMode: "opaque",
            usage: GPUTextureUsage.RENDER_ATTACHMENT
        };

        context.configure(canvasConfig);

        this.adapter = adapter;
        this.device = device;
        this.context = context;
        this.canvasConfig = canvasConfig;

        await this.initializeSpriteSystem();
    }

    async initializeSpriteSystem() {
        if (!this.device) return;

        // Quad Buffer
        const vertices = new Float32Array([
            // Pos        // UV
            -0.5, -0.5, 0.0, 0.0, // TL
            -0.5, 0.5, 0.0, 1.0, // BL
            0.5, 0.5, 1.0, 1.0, // TR
            0.5, -0.5, 1.0, 0.0, // BR
        ]);

        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

        this.quadBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });

        this.indexBuffer = this.device.createBuffer({
            size: new Uint16Array(indices).byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true
        });

        new Float32Array(this.quadBuffer.getMappedRange()).set(vertices);
        this.quadBuffer.unmap();

        new Uint16Array(this.indexBuffer.getMappedRange()).set(indices);
        this.indexBuffer.unmap();

        // Projection Buffer
        this.projectionBuffer = this.device.createBuffer({
            size: 64, // 4x4 float32
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Shader
        const shaderCode = `
            struct Uniforms {
                projection: mat4x4<f32>,
            }
            
            struct Model {
                matrix: mat4x4<f32>,
            }

            @group(0) @binding(0) var<uniform> global: Uniforms;
            @group(1) @binding(0) var mySampler: sampler;
            @group(1) @binding(1) var myTexture: texture_2d<f32>;
            @group(2) @binding(0) var<uniform> model: Model;

            struct VertexInput {
                @location(0) position: vec2<f32>,
                @location(1) uv: vec2<f32>,
            }

            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) uv: vec2<f32>,
            }

            @vertex
            fn vs_main(input: VertexInput) -> VertexOutput {
                var out: VertexOutput;
                out.position = global.projection * model.matrix * vec4<f32>(input.position, 0.0, 1.0);
                out.uv = input.uv;
                return out;
            }

            @fragment
            fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
                return textureSample(myTexture, mySampler, in.uv);
            }
        `;
        const shaderModule = this.device.createShaderModule({ code: shaderCode });

        // Bind Group Layouts
        const globalBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        this.spriteBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} }
            ]
        });

        const modelBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        // Pipeline Layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [globalBindGroupLayout, this.spriteBindGroupLayout, modelBindGroupLayout]
        });

        this.spritePipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 4 * 4, // 4 floats * 4 bytes
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x2' },
                        { shaderLocation: 1, offset: 8, format: 'float32x2' }
                    ]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.canvasConfig!.format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                    }
                }]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });

        // Create Global Bind Group
        this.projectionBindGroup = this.device.createBindGroup({
            layout: globalBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.projectionBuffer }
            }]
        });
    }

    renderEntities(entities: Entity[], cameraPosition: Vector2 = new Vector2(0, 0)) {
        if (!this.device || !this.context || !this.spritePipeline || !this.projectionBindGroup || !this.quadBuffer) return;

        // Update Projection
        const canvas = this.context.canvas as HTMLCanvasElement;
        // Ortho: 0 to width, height to 0 (top-left origin)
        // To move camera, we shift the bounds by the camera position
        this.projectionMatrix = Matrix4.orthographic(
            cameraPosition.x, 
            cameraPosition.x + canvas.width, 
            cameraPosition.y + canvas.height, 
            cameraPosition.y, 
            -1, 1
        );
        this.device.queue.writeBuffer(this.projectionBuffer!, 0, this.projectionMatrix.values as unknown as BufferSource);

        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.spritePipeline);
        passEncoder.setBindGroup(0, this.projectionBindGroup);
        passEncoder.setVertexBuffer(0, this.quadBuffer);
        passEncoder.setIndexBuffer(this.indexBuffer!, 'uint16');

        for (const entity of entities) {
            const textureComponent = entity.components.find(c => c instanceof Texture) as Texture;
            if (textureComponent && textureComponent.texture && textureComponent.view && textureComponent.sampler) {

                // Create Texture Bind Group if not exists
                if (!textureComponent.bindGroup) {
                    textureComponent.bindGroup = this.device.createBindGroup({
                        layout: this.spriteBindGroupLayout!,
                        entries: [
                            { binding: 0, resource: textureComponent.sampler },
                            { binding: 1, resource: textureComponent.view }
                        ]
                    });
                }

                // Calculate Model Matrix
                // Translate, Rotate, Scale
                let modelMatrix = Matrix4.identity();
                modelMatrix = modelMatrix.multiply(Matrix4.translation(entity.position.x, entity.position.y, 0));
                modelMatrix = modelMatrix.multiply(Matrix4.rotationZ(entity.rotation));
                modelMatrix = modelMatrix.multiply(Matrix4.scaling(entity.scale.x, entity.scale.y, 1));

                // Create Model Buffer (Inefficient: creating buffer every frame per object)
                // Optimization: Use a large buffer and dynamic offsets, or writeBuffer.
                const modelBuffer = this.device.createBuffer({
                    size: 64,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: true
                });
                new Float32Array(modelBuffer.getMappedRange()).set(modelMatrix.values);
                modelBuffer.unmap();

                const modelBindGroup = this.device.createBindGroup({
                    layout: this.spritePipeline.getBindGroupLayout(2),
                    entries: [{
                        binding: 0,
                        resource: { buffer: modelBuffer }
                    }]
                });

                passEncoder.setBindGroup(1, textureComponent.bindGroup);
                passEncoder.setBindGroup(2, modelBindGroup);
                passEncoder.drawIndexed(6);
            }
        }

        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }

    createRenderTarget() {
        if (!this.context) {
            throw new Error("Context is not initialized.");
        }

        const colorTexture = this.context.getCurrentTexture();
        const colorView = colorTexture.createView();

        const colorAttachment: GPURenderPassColorAttachment = {
            view: colorView,
            clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
            loadOp: "clear",
            storeOp: "store"
        }

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [colorAttachment]
        }

        return renderPassDescriptor;
    }

    createSingleAttributeVertexBuffer(vertices: Float32Array, attributeDescription: GPUVertexAttribute, arrayStride: number) {
        if (!this.device) {
            throw new Error("Device is not initialized.");
        }

        const layout: GPUVertexBufferLayout = {
            arrayStride,
            stepMode: "vertex",
            attributes: [attributeDescription]
        }

        const bufferDesc: GPUBufferDescriptor = {
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        }

        const buffer = this.device.createBuffer(bufferDesc);
        const writeArray = new Float32Array(buffer.getMappedRange());
        writeArray.set(vertices);
        buffer.unmap();

        return { buffer, layout };
    }

    createShaderModule(device: GPUDevice, code: string) {
        const shaderModuleDesc: GPUShaderModuleDescriptor = {
            code
        };

        return device.createShaderModule(shaderModuleDesc);
    }

    createPipeline(shaderModule: GPUShaderModule, vertexBuffers: GPUVertexBufferLayout[], format: GPUTextureFormat) {
        if (!this.device) {
            throw new Error("Device is not initialized.");
        }

        const pipelineLayoutDescriptor: GPUPipelineLayoutDescriptor = {
            bindGroupLayouts: []
        };
        const layout = this.device.createPipelineLayout(pipelineLayoutDescriptor);

        const colorState: GPUColorTargetState = {
            format: format,
        }

        const pipelineDescriptor: GPURenderPipelineDescriptor = {
            layout,
            vertex: {
                module: shaderModule,
                entryPoint: "vs_main",
                buffers: vertexBuffers
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fs_main",
                targets: [colorState]
            },
            primitive: {
                topology: "triangle-list",
                frontFace: "cw",
                cullMode: "back"
            }
        }

        const pipeline = this.device.createRenderPipeline(pipelineDescriptor);
        return pipeline;
    }





    render(format: GPUTextureFormat, shaderCode: string, vertexCount: number, instanceCount: number, vertices: Float32Array, colors: Float32Array) {
        if (!this.device || !this.context) {
            throw new Error("Renderer is not initialized.");
        }

        const { buffer: positionBuffer, layout: positionBufferLayout } = this.createSingleAttributeVertexBuffer(vertices, {
            format: "float32x3",
            offset: 0,
            shaderLocation: 0
        }, 3 * Float32Array.BYTES_PER_ELEMENT);
        const { buffer: colorBuffer, layout: colorBufferLayout } = this.createSingleAttributeVertexBuffer(colors, {
            format: "float32x3",
            offset: 0,
            shaderLocation: 1
        }, 3 * Float32Array.BYTES_PER_ELEMENT);

        const commandEncoder = this.device.createCommandEncoder();

        const passEncoder = commandEncoder.beginRenderPass(this.createRenderTarget());
        const canvas = this.context.canvas as HTMLCanvasElement;
        passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
        passEncoder.setPipeline(this.createPipeline(this.createShaderModule(this.device, shaderCode), [positionBufferLayout, colorBufferLayout], format));
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, colorBuffer);
        passEncoder.draw(vertexCount, instanceCount);
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}