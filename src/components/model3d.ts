import { Component } from "../types/component";
import { Entity } from "../entity";
import { SimpleMesh } from "../assets/gltfLoader";

export class Model3D extends Component {
    mesh: SimpleMesh | null = null;
    bindGroup: GPUBindGroup | null = null;
    positionBuffer: GPUBuffer | null = null;
    uvBuffer: GPUBuffer | null = null;
    indexBuffer: GPUBuffer | null = null;
    indexCount: number = 0;
    indexFormat: GPUIndexFormat = 'uint16';

    constructor(parent: Entity, mesh?: SimpleMesh) {
        super(parent);
        if (mesh) this.mesh = mesh;
    }

    setMesh(mesh: SimpleMesh) {
        this.mesh = mesh;
    }

    async uploadToDevice(device: GPUDevice) {
        if (!this.mesh) return;
        // create position buffer
        this.positionBuffer = device.createBuffer({ size: this.mesh.positions.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
        new Float32Array(this.positionBuffer.getMappedRange()).set(this.mesh.positions);
        this.positionBuffer.unmap();

        // create uv buffer
        if (this.mesh.uvs) {
            this.uvBuffer = device.createBuffer({ size: this.mesh.uvs.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
            new Float32Array(this.uvBuffer.getMappedRange()).set(this.mesh.uvs);
            this.uvBuffer.unmap();
        }

        // create index buffer
        if (this.mesh.indices) {
            this.indexCount = this.mesh.indices.length;
            if (this.mesh.indices instanceof Uint16Array) {
                this.indexFormat = 'uint16';
                this.indexBuffer = device.createBuffer({ size: this.mesh.indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
                new Uint16Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices as Uint16Array);
                this.indexBuffer.unmap();
            } else {
                this.indexFormat = 'uint32';
                this.indexBuffer = device.createBuffer({ size: (this.mesh.indices as Uint32Array).byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, mappedAtCreation: true });
                new Uint32Array(this.indexBuffer.getMappedRange()).set(this.mesh.indices as Uint32Array);
                this.indexBuffer.unmap();
            }
        }

        // textures are handled by Renderer when creating bind groups
    }
}

export default Model3D;
