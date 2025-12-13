import { load } from "@loaders.gl/core";
import { GLTFLoader, postProcessGLTF } from "@loaders.gl/gltf";

/**
 * Debug utility to inspect GLTF file structure
 * This helps diagnose loading issues by printing the entire GLTF structure
 */
export async function debugGLTF(path: string): Promise<void> {
  console.log("=".repeat(80));
  console.log(`DEBUG GLTF: ${path}`);
  console.log("=".repeat(80));

  const gltf = await load(path, GLTFLoader);
  const scene = postProcessGLTF(gltf);

  console.log("\n📦 GLTF Structure:");
  console.log(`  - Scenes: ${scene.scenes?.length || 0}`);
  console.log(`  - Nodes: ${scene.nodes?.length || 0}`);
  console.log(`  - Meshes: ${scene.meshes?.length || 0}`);
  console.log(`  - Materials: ${scene.materials?.length || 0}`);
  console.log(`  - Textures: ${scene.textures?.length || 0}`);
  console.log(`  - Animations: ${scene.animations?.length || 0}`);

  // Default scene info
  const sceneIndex = scene.scene?.index ?? 0;
  console.log(`\n🎬 Default Scene: ${sceneIndex}`);

  if (scene.scenes && scene.scenes[sceneIndex]) {
    const defaultScene = scene.scenes[sceneIndex];
    console.log(`  - Name: ${defaultScene.name || "(unnamed)"}`);
    console.log(`  - Root Nodes: [${defaultScene.nodes?.join(", ")}]`);
  }

  // Node hierarchy
  if (scene.nodes) {
    console.log("\n🌳 Node Hierarchy:");
    for (let i = 0; i < scene.nodes.length; i++) {
      const node = scene.nodes[i];
      printNode(node, i, 0);
    }
  }

  // Mesh details
  if (scene.meshes) {
    console.log("\n📐 Mesh Details:");
    for (let i = 0; i < scene.meshes.length; i++) {
      const mesh = scene.meshes[i];
      console.log(`  [${i}] ${mesh.name || "(unnamed)"}`);
      console.log(`      Primitives: ${mesh.primitives?.length || 0}`);

      if (mesh.primitives) {
        for (let p = 0; p < mesh.primitives.length; p++) {
          const prim = mesh.primitives[p];
          const attrs = prim.attributes || {};
          const vertexCount = attrs.POSITION?.value?.length / 3 || 0;
          const indexCount = prim.indices?.value?.length || 0;

          console.log(`      [${p}] Vertices: ${vertexCount}, Indices: ${indexCount}`);
          console.log(
            `          Attributes: ${Object.keys(attrs).join(", ") || "none"}`,
          );

          if (attrs.POSITION?.value) {
            const positions = attrs.POSITION.value;
            let minX = Infinity,
              maxX = -Infinity;
            let minY = Infinity,
              maxY = -Infinity;
            let minZ = Infinity,
              maxZ = -Infinity;

            for (let v = 0; v < positions.length; v += 3) {
              minX = Math.min(minX, positions[v]);
              maxX = Math.max(maxX, positions[v]);
              minY = Math.min(minY, positions[v + 1]);
              maxY = Math.max(maxY, positions[v + 1]);
              minZ = Math.min(minZ, positions[v + 2]);
              maxZ = Math.max(maxZ, positions[v + 2]);
            }

            console.log(
              `          Bounds: X[${minX.toFixed(2)}, ${maxX.toFixed(2)}] Y[${minY.toFixed(2)}, ${maxY.toFixed(2)}] Z[${minZ.toFixed(2)}, ${maxZ.toFixed(2)}]`,
            );
          }
        }
      }
    }
  }

  console.log("\n" + "=".repeat(80));
}

function printNode(node: any, index: number, depth: number): void {
  const indent = "  ".repeat(depth);
  const prefix = depth > 0 ? "└─ " : "";

  let info = `${indent}${prefix}[${index}] ${node.name || "(unnamed)"}`;

  // Add transform info
  if (node.translation || node.rotation || node.scale || node.matrix) {
    info += " {";
    if (node.translation) {
      info += ` T:[${node.translation.map((v: number) => v.toFixed(2)).join(",")}]`;
    }
    if (node.rotation) {
      info += ` R:[${node.rotation.map((v: number) => v.toFixed(2)).join(",")}]`;
    }
    if (node.scale) {
      info += ` S:[${node.scale.map((v: number) => v.toFixed(2)).join(",")}]`;
    }
    if (node.matrix) {
      info += " M:[matrix]";
    }
    info += " }";
  }

  // Add mesh reference
  if (node.mesh !== undefined) {
    info += ` → Mesh[${node.mesh}]`;
  }

  console.log(info);

  // Print children
  if (node.children && node.children.length > 0) {
    for (const childIndex of node.children) {
      // Note: This assumes we have access to all nodes, might need adjustment
      console.log(`${indent}  └─ child[${childIndex}]`);
    }
  }
}

/**
 * Quick helper to log vertex data from a primitive
 */
export function logPrimitiveVertices(primitive: any, maxVertices: number = 10): void {
  const positions = primitive.attributes?.POSITION?.value;
  const normals = primitive.attributes?.NORMAL?.value;

  if (!positions) {
    console.log("No position data");
    return;
  }

  const vertexCount = Math.min(positions.length / 3, maxVertices);
  console.log(`\nFirst ${vertexCount} vertices:`);

  for (let i = 0; i < vertexCount; i++) {
    const p = i * 3;
    const pos = `(${positions[p].toFixed(3)}, ${positions[p + 1].toFixed(3)}, ${positions[p + 2].toFixed(3)})`;

    let output = `  [${i}] pos: ${pos}`;

    if (normals) {
      const norm = `(${normals[p].toFixed(3)}, ${normals[p + 1].toFixed(3)}, ${normals[p + 2].toFixed(3)})`;
      output += ` norm: ${norm}`;
    }

    console.log(output);
  }
}
