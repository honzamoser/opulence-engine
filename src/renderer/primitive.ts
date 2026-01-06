import { Material } from "./material";
// import { Mesh } from "./mesh";

export function createDiamond(): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  const vertices = new Float32Array([
    // Top vertex
    0,
    1,
    0, // Vertex 0
    // Middle ring
    -0.5,
    0,
    -0.5, // Vertex 1
    0.5,
    0,
    -0.5, // Vertex 2
    0.5,
    0,
    0.5, // Vertex 3
    -0.5,
    0,
    0.5, // Vertex 4
    // Bottom vertex
    0,
    -1,
    0, // Vertex 5
  ]);

  const indices = new Uint32Array([
    // Top pyramid
    0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4,
    // Bottom pyramid
    5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 1,
  ]);

  return {
    vertices,
    indices,
  };
}

export function createCube(): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  // 2. Define Geometry (Cube Positions Only - No Color)
  const vertices = new Float32Array([
    // Front face
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // Back face
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
  ]);

  const indices = new Uint32Array([
    0,
    1,
    2,
    0,
    2,
    3, // Front
    4,
    5,
    1,
    4,
    1,
    0, // Bottom
    3,
    2,
    6,
    3,
    6,
    7, // Top
    1,
    5,
    6,
    1,
    6,
    2, // Right
    4,
    0,
    3,
    4,
    3,
    7, // Left
    5,
    4,
    7,
    5,
    7,
    6, // Back
  ]);

  return {
    vertices,
    indices,
  };
}

// export function createPlane(material: Material) {
//   const vertices = new Float32Array([
//     // Vertex 0: Position(-1, 0, -1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
//     -1, 0, -1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
//     // Vertex 1: Position(1, 0, -1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
//     1, 0, -1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
//     // Vertex 2: Position(1, 0, 1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
//     1, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
//     // Vertex 3: Position(-1, 0, 1), Normal(0, 1, 0), Color(0.5, 0.5, 0.5, 1)
//     -1, 0, 1, 0, 1, 0, 0.5, 0.5, 0.5, 1,
//   ]);

//   const indices = new Uint16Array([0, 2, 1, 0, 3, 2]);

//   return new Mesh(vertices, indices, material);
// }
//
export function createPyramid(): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  const vertices = new Float32Array([
    // Base

    -0.5,
    0,
    -0.5, // Vertex 0
    0.5,
    0,
    -0.5, // Vertex 1
    0.5,
    0,
    0.5, // Vertex 2
    -0.5,
    0,
    0.5, // Vertex 3
    // Apex
    0,
    1,
    0, // Vertex 4
  ]);

  const indices = new Uint32Array([
    // Base
    1, 2, 0, 2, 3, 0,
    // Sides
    0, 4, 1, 1, 4, 2, 2, 4, 3, 3, 4, 0,
  ]);

  return {
    vertices,
    indices,
  };
}
