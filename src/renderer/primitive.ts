import { Mesh } from "./mesh";

export function createCube(device: GPUDevice): Mesh {
  const vertices = new Float32Array([
    // Front face (Normal: 0, 0, 1)
    -1, -1, 1, 0, 0, 1, 1, 0, 0, 1, 1, -1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0,
    0, 1, 1, 0, 0, 1, -1, 1, 1, 0, 0, 1, 1, 0, 0, 1,

    // Back face (Normal: 0, 0, -1)
    -1, -1, -1, 0, 0, -1, 0, 1, 0, 1, -1, 1, -1, 0, 0, -1, 0, 1, 0, 1, 1, 1, -1,
    0, 0, -1, 0, 1, 0, 1, 1, -1, -1, 0, 0, -1, 0, 1, 0, 1,

    // Top face (Normal: 0, 1, 0)
    -1, 1, -1, 0, 1, 0, 0, 0, 1, 1, -1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0,
    1, 0, 0, 0, 1, 1, 1, 1, -1, 0, 1, 0, 0, 0, 1, 1,

    // Bottom face (Normal: 0, -1, 0)
    -1, -1, -1, 0, -1, 0, 1, 1, 0, 1, 1, -1, -1, 0, -1, 0, 1, 1, 0, 1, 1, -1, 1,
    0, -1, 0, 1, 1, 0, 1, -1, -1, 1, 0, -1, 0, 1, 1, 0, 1,

    // Right face (Normal: 1, 0, 0)
    1, -1, -1, 1, 0, 0, 1, 0, 1, 1, 1, 1, -1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1,
    0, 0, 1, 0, 1, 1, 1, -1, 1, 1, 0, 0, 1, 0, 1, 1,

    // Left face (Normal: -1, 0, 0)
    -1, -1, -1, -1, 0, 0, 0, 1, 1, 1, -1, -1, 1, -1, 0, 0, 0, 1, 1, 1, -1, 1, 1,
    -1, 0, 0, 0, 1, 1, 1, -1, 1, -1, -1, 0, 0, 0, 1, 1, 1,
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2,
    0,
    2,
    3, // Front
    4,
    5,
    6,
    4,
    6,
    7, // Back
    8,
    9,
    10,
    8,
    10,
    11, // Top
    12,
    13,
    14,
    12,
    14,
    15, // Bottom
    16,
    17,
    18,
    16,
    18,
    19, // Right
    20,
    21,
    22,
    20,
    22,
    23, // Left
  ]);

  return new Mesh(device, vertices, indices);
}

export function createPlane(device: GPUDevice) {
  const vertices = new Float32Array([
    // Vertex 0: Position(-1, 0, -1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
    -1, 0, -1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
    // Vertex 1: Position(1, 0, -1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
    1, 0, -1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
    // Vertex 2: Position(1, 0, 1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
    1, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
    // Vertex 3: Position(-1, 0, 1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
    -1, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
  ]);

  const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);

  return new Mesh(device, vertices, indices);
}
