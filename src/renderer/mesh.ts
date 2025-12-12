import { vec3, Vec3 } from "wgpu-matrix";

export class Mesh {
  device: GPUDevice;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  vertexCount: number;
  indexCount: number;
  AABB: {
    min: Vec3;
    max: Vec3;
  } = {
    min: vec3.create(),
    max: vec3.create(),
  };

  constructor(device: GPUDevice, vertices: Float32Array, indices: Uint16Array) {
    this.device = device;
    this.indexCount = indices.length;
    this.vertexCount = vertices.length;

    this.vertexBuffer = this.device.createBuffer({
      label: "Mesh Vertex Buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    this.indexBuffer = this.device.createBuffer({
      label: "Mesh Index Buffer",
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.indexBuffer, 0, indices);

    this.AABB.min = vec3.create(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    this.AABB.max = vec3.create(
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    );

    const stride = 10;

    for (let i = 0; i < vertices.length; i += stride) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];

      vec3.min(this.AABB.min, [x, y, z], this.AABB.min);
      vec3.max(this.AABB.max, [x, y, z], this.AABB.max);
    }

    console.log(this.AABB);
  }
}
