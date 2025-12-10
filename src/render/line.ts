import { Matrix4 } from "../types/matrix4";
import { Vector2 } from "../types/vector2";

export interface Line {
    start: Vector2;
    end: Vector2;
    color: { r: number, g: number, b: number, a: number };
}

export class LineRenderer {
    device: GPUDevice;
    format: GPUTextureFormat;
    
    pipeline: GPURenderPipeline | null = null;
    unitLineBuffer: GPUBuffer | null = null;
    
    // Dynamic Uniform Buffer for Models
    // Storing: Matrix (64 bytes) + Color (16 bytes) = 80 bytes
    // Aligned to 256 bytes for dynamic offset
    modelBuffer: GPUBuffer | null = null;
    modelBindGroup: GPUBindGroup | null = null;
    
    constructor(device: GPUDevice, format: GPUTextureFormat) {
        this.device = device;
        this.format = format;
    }

    async initialize() {
        // 1. Unit Line Buffer (0,0 to 1,0)
        const vertices = new Float32Array([
            0.0, 0.0,
            1.0, 0.0
        ]);
        
        this.unitLineBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(this.unitLineBuffer.getMappedRange()).set(vertices);
        this.unitLineBuffer.unmap();

        // 2. Shader
        const shaderCode = `
            struct Uniforms {
                projection: mat4x4<f32>,
            }
            
            struct LineData {
                matrix: mat4x4<f32>,
                color: vec4<f32>,
            }

            @group(0) @binding(0) var<uniform> global: Uniforms;
            @group(1) @binding(0) var<uniform> lineData: LineData;

            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) color: vec4<f32>,
            }

            @vertex
            fn vs_main(@location(0) pos: vec2<f32>) -> VertexOutput {
                var out: VertexOutput;
                out.position = global.projection * lineData.matrix * vec4<f32>(pos, 0.0, 1.0);
                out.color = lineData.color;
                return out;
            }

            @fragment
            fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
                return color;
            }
        `;
        const shaderModule = this.device.createShaderModule({ code: shaderCode });

        // 3. Bind Group Layouts
        // Group 0: Projection (Shared with Renderer ideally, or compatible layout)
        const globalBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform' }
            }]
        });

        // Group 1: Line Data (Matrix + Color)
        const lineBindGroupLayout = this.device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform', hasDynamicOffset: true }
            }]
        });

        // 4. Pipeline
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [globalBindGroupLayout, lineBindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 8, // 2 floats * 4 bytes
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                    }
                }]
            },
            primitive: {
                topology: 'line-list'
            }
        });

        // 5. Model Buffer (Capacity for 1000 lines)
        const alignedSize = 256; 
        this.modelBuffer = this.device.createBuffer({
            size: 1000 * alignedSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        this.modelBindGroup = this.device.createBindGroup({
            layout: lineBindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this.modelBuffer,
                    size: 80 // 64 bytes (mat4) + 16 bytes (vec4 color)
                }
            }]
        });
    }

    render(passEncoder: GPURenderPassEncoder, projectionBindGroup: GPUBindGroup, lines: Line[]) {
        if (!this.pipeline || !this.unitLineBuffer || !this.modelBuffer || !this.modelBindGroup) return;

        const alignedSize = 256;
        const floatsPerLine = alignedSize / 4;
        const data = new Float32Array(lines.length * floatsPerLine);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Calculate Transform
            // 1. Vector from Start to End
            const diff = line.end.subtract(line.start);
            const length = diff.length();
            const angle = Math.atan2(diff.y, diff.x);

            // 2. Matrix: Translate(Start) * Rotate(Angle) * Scale(Length, 1, 1)
            let matrix = Matrix4.identity();
            matrix = matrix.multiply(Matrix4.translation(line.start.x, line.start.y, 0));
            matrix = matrix.multiply(Matrix4.rotationZ(angle));
            matrix = matrix.multiply(Matrix4.scaling(length, 1, 1));

            // 3. Write Matrix
            const offset = i * floatsPerLine;
            data.set(matrix.values, offset);

            // 4. Write Color (after 16 floats of matrix)
            data[offset + 16] = line.color.r;
            data[offset + 17] = line.color.g;
            data[offset + 18] = line.color.b;
            data[offset + 19] = line.color.a;
        }

        // Upload
        this.device.queue.writeBuffer(this.modelBuffer, 0, data);

        // Draw
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, projectionBindGroup);
        passEncoder.setVertexBuffer(0, this.unitLineBuffer);

        for (let i = 0; i < lines.length; i++) {
            passEncoder.setBindGroup(1, this.modelBindGroup, [i * alignedSize]);
            passEncoder.draw(2);
        }
    }
}