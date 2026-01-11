import { Vec3, mat4, vec3 } from "wgpu-matrix";
import { Entity } from "../../entity";
import { Light } from "../../renderer/light";
import MeshComponent from "../components/mesh.component";
import TransformComponent from "../components/transform.component";
import { System } from "../system";
import { Engine } from "../../engine";
import { Renderer } from "../../renderer/renderer";

import { Material } from "../../renderer/material";

import { log_component } from "../../debug/ecs_debug";

import { IndirectRenderer } from "../../renderer/indirectRenderer";
import { Helios2Renderer } from "../../renderer/renderer";
import { namespace } from "../component-gen";

@namespace("builtin.render.RenderSystem")
export default class RenderSystem extends System {
  materials: Material[] = [];

  registerMaterial(defaultMaterial: Material) {
    this.materials.push(defaultMaterial);
  }

  renderer: Helios2Renderer;

  cameraComponentId: number | null = null;
  cameraTransformComponentId: number | null = null;

  mesh_meshId_Accesor: any = null;

  mesh: MeshComponent | null = null;
  meshTransform: TransformComponent | null = null;
  meshTransformComponentId: number | null = null;
  engine: Engine | null = null;

  public async update(entities: number[][], delta: number, engine: Engine) {
    // if (!this.renderer.ready) return;
    // if (!this.mesh || !this.meshTransform) return;
    // const projectionMatrix = engine.ecs.getComponentValue(
    //   this.cameraComponentId,
    //   CameraComponent,
    //   "projectionMatrix",
    // );
    // const cameraPosition = engine.ecs.getComponentValue(
    //   this.cameraTransformComponentId,
    //   TransformComponent,
    //   "position",
    // );
    // // Calculate the transform matrix before rendering
    // this.calculateTransformMatrix(
    //   this.meshTransform,
    //   this.meshTransformComponentId!,
    //   this.engine!,
    // );
    // // Re-fetch the mesh transform to get the updated matrix
    // this.meshTransform = this.engine!.ecs.getComponentValues(
    //   this.meshTransformComponentId!,
    //   TransformComponent,
    // );
    // this.renderer.render(
    //   [
    //     {
    //       meshId: this.mesh.meshId,
    //       position: this.meshTransform.position,
    //       rotation: this.meshTransform.rotation,
    //       scale: this.meshTransform.scale,
    //       matrix: this.meshTransform.matrix,
    //     },
    //   ],
    //   cameraPosition,
    //   projectionMatrix,
    //   this.materials[0],
    // );
    //
    //
    //

    
    engine.query(MeshComponent, TransformComponent).forEach((entity) => {
      
      const meshId = engine.entities[entity][MeshComponent.id];
      const transformId = engine.entities[entity][TransformComponent.id];



      const transform: TransformComponent = engine.ecs.getComponentValues(
        transformId,
        TransformComponent,
      );
      const mesh: MeshComponent = engine.ecs.getComponentValues(
        meshId,
        MeshComponent,
      );



      if(mesh.meshId === 0) {
        this.instantiate(engine, entity);
        return;
      }

      
      this.calculateTransformMatrix(transform, transformId, engine);
      

      this.renderer._updateMatrix(mesh.meshId, transform.matrix);
    });

    this.renderer.render(delta);
  }

  afterUpdate(engine: Engine) {}

  // vertexBuffers: GPUBuffer[] = [];

  public async start(engine: Engine) {
    const meshEntities = engine.query(MeshComponent, TransformComponent);

    meshEntities.forEach((entity) => {
      this.instantiate(engine, entity);
    });
  }

  private instantiate(engine: Engine, entity: number) {
    const transformId = engine.entities[entity][TransformComponent.id];
    const transform: TransformComponent = engine.ecs.getComponentValues(
      transformId,
      TransformComponent
    );
    const mesh = engine.ecs.getComponentValues(
      engine.entities[entity][MeshComponent.id],
      MeshComponent
    );

    this.calculateTransformMatrix(transform, transformId, engine);

    engine.ecs.setComponentValue(
      engine.entities[entity][MeshComponent.id],
      MeshComponent,
      "meshId",
      this.renderer._instantiate(
        0,
        transform.matrix,
        new Float32Array([1, 1, 1, 1])
      ) + 1
    );
  }

  calculateBoundingBox(
    vertices: Float32Array,
    max: Float32Array,
    min: Float32Array,
  ) {
    for (let i = 0; i < vertices.length; i += 10) {
      const x = vertices[i];
      const y = vertices[i + 1];
      const z = vertices[i + 2];

      vec3.min(min, [x, y, z], min);
      vec3.max(max, [x, y, z], max);
    }
  }

  calculateTransformMatrix(
    t: TransformComponent,
    componentId: number,
    engine: Engine,
  ) {
    // const translationMatrix = mat4.translation(t.position, mat4.create());
    const translationMatrix = mat4.translation(t.position);
    const rotationXMatrix = mat4.rotationX(t.rotation[0], mat4.create());
    const rotationYMatrix = mat4.rotationY(t.rotation[1], mat4.create());
    const rotationZMatrix = mat4.rotationZ(t.rotation[2], mat4.create());
    const scaleMatrix = mat4.scaling(t.scale, mat4.create());

    let rotationMatrix = mat4.multiply(rotationYMatrix, rotationXMatrix);
    rotationMatrix = mat4.multiply(rotationZMatrix, rotationMatrix);

    let transformMatrix = mat4.multiply(translationMatrix, rotationMatrix);
    transformMatrix = mat4.multiply(transformMatrix, scaleMatrix);

    t.matrix.set(transformMatrix);
  }

  constructor(renderer: Helios2Renderer) {
    super();
    this.renderer = renderer;
  }

  uploadMesh(engine: Engine, componentId: number) {
    const cubeData = generateCubeData();
    const min = engine.ecs.getComponentValueSubarray(
      componentId,
      MeshComponent,
      "boundingBoxMin",
    );
    const max = engine.ecs.getComponentValueSubarray(
      componentId,
      MeshComponent,
      "boundingBoxMax",
    );
    this.calculateBoundingBox(cubeData.vertices, max, min);
    return this.renderer.uploadMesh(
      cubeData.vertices,
      cubeData.indices,
      cubeData.normals,
    );
  }
}

function generateCubeData() {
  const vertices = new Float32Array([
    // Front face
    -1, -1, 1, 0, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
    0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 0, 1, 1, 1, 1, 1,

    // Back face
    -1, -1, -1, 0, 0, -1, 1, 1, 1, 1, -1, 1, -1, 0, 0, -1, 1, 1, 1, 1, 1, 1, -1,
    0, 0, -1, 1, 1, 1, 1, 1, -1, -1, 0, 0, -1, 1, 1, 1, 1,

    // Top face
    -1, 1, -1, 0, 1, 0, 1, 1, 1, 1, -1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0,
    1, 0, 1, 1, 1, 1, 1, 1, -1, 0, 1, 0, 1, 1, 1, 1,

    // Bottom face
    -1, -1, -1, 0, -1, 0, 1, 1, 1, 1, 1, -1, -1, 0, -1, 0, 1, 1, 1, 1, 1, -1, 1,
    0, -1, 0, 1, 1, 1, 1, -1, -1, 1, 0, -1, 0, 1, 1, 1, 1,

    // Right face
    1, -1, -1, 1, 0, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 0, 1, 1, 1, 1,

    // Left face
    -1, -1, -1, -1, 0, 0, 1, 1, 1, 1, -1, -1, 1, -1, 0, 0, 1, 1, 1, 1, -1, 1, 1,
    -1, 0, 0, 1, 1, 1, 1, -1, 1, -1, -1, 0, 0, 1, 1, 1, 1,
  ]);

  const indices = new Uint16Array([
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ]);

  return { vertices, indices };
}
