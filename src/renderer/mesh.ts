import { vec3, Vec3 } from "wgpu-matrix";
import { Material } from "./material";

export class Mesh {
  device: GPUDevice;
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;

  vertices: Float32Array;
  indices: Uint16Array;

  material: Material;

  vertexCount: number;
  indexCount: number;
  AABB: {
    min: Vec3;
    max: Vec3;
  } = {
    min: vec3.create(),
    max: vec3.create(),
  };

  start(device: GPUDevice) {
    this.device = device;
    const vertices = this.vertices;
    const indices = this.indices;

    this.vertexBuffer = this.device.createBuffer({
      label: "Mesh Vertex Buffer",
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);

    // Index buffer size must be a multiple of 4 bytes
    // Uint16Array elements are 2 bytes, so pad if needed
    const indexByteLength = indices.byteLength;
    const paddedSize = Math.ceil(indexByteLength / 4) * 4;

    this.indexBuffer = this.device.createBuffer({
      label: "Mesh Index Buffer",
      size: paddedSize,
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
  }

  constructor(
    vertices: Float32Array,
    indices: Uint16Array,
    material: Material,
  ) {
    this.indexCount = indices.length;
    this.vertexCount = vertices.length;

    this.vertices = vertices;
    this.indices = indices;
    this.material = material;
  }
}
