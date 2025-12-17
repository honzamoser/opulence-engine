import { Vec3, mat4, vec3 } from "wgpu-matrix";
import { Entity } from "../../entity";
import { Light } from "../../renderer/light";
import MeshComponent from "../components/mesh";
import TransformComponent from "../components/transform";
import { System } from "../system";
import { Engine } from "../../engine";
import { Renderer } from "../../renderer/renderer";
import CameraComponent from "../components/camera";
import { Material } from "../../renderer/material";
import MaterialComponent from "../components/material";
import { log_component } from "../../debug/ecs_debug";
import { Mesh } from "../../renderer/mesh";

export class RenderSystem extends System {
  materials: Material[] = [];

  registerMaterial(defaultMaterial: Material) {
    this.materials.push(defaultMaterial);
  }

  renderer: Renderer;

  cameraComponentId: number | null = null;
  cameraTransformComponentId: number | null = null;

  mesh_meshId_Accesor: any = null;

  mesh: MeshComponent | null = null;
  meshTransform: TransformComponent | null = null;
  meshTransformComponentId: number | null = null;
  engine: Engine | null = null;

  public async update(entities: Entity[], delta: number, engine: Engine) {
    if (!this.renderer.ready) return;

    if (!this.mesh || !this.meshTransform) return;

    const projectionMatrix = engine.ecs.getComponentValue(
      this.cameraComponentId,
      CameraComponent,
      "projectionMatrix",
    );
    const cameraPosition = engine.ecs.getComponentValue(
      this.cameraTransformComponentId,
      TransformComponent,
      "position",
    );

    // Calculate the transform matrix before rendering
    this.calculateTransformMatrix(
      this.meshTransform,
      this.meshTransformComponentId!,
      this.engine!,
    );

    // Re-fetch the mesh transform to get the updated matrix
    this.meshTransform = this.engine!.ecs.getComponentValues(
      this.meshTransformComponentId!,
      TransformComponent,
    );

    this.renderer.render(
      [
        {
          meshId: this.mesh.meshId,
          position: this.meshTransform.position,
          rotation: this.meshTransform.rotation,
          scale: this.meshTransform.scale,
          matrix: this.meshTransform.matrix,
        },
      ],
      cameraPosition,
      projectionMatrix,
      this.materials[0],
    );
  }

  afterUpdate(engine: Engine) {}

  vertexBuffers: GPUBuffer[] = [];

  public async start(engine: Engine) {
    await this.renderer.initialize();

    this.materials.forEach((x) => x.start());

    const query = engine.query(MeshComponent, TransformComponent);
    const accessor = engine.ecs.createFieldAccessor(
      MeshComponent,
      "resourceIdentifier",
    );

    query.forEach((entity) => {
      const compInstanceId = engine.entities[entity][MeshComponent.id];

      const resourceId = accessor.get(compInstanceId);

      if (resourceId == "primitive:cube") {
        engine.ecs.setComponentValue(
          compInstanceId,
          MeshComponent,
          "meshId",
          this.uploadMesh(engine, compInstanceId) + 1,
        );
      }

      log_component(engine, entity, MeshComponent);
    });

    this.engine = engine;
    this.meshTransformComponentId =
      engine.entities[query[0]][TransformComponent.id];

    this.mesh = engine.ecs.getComponentValues(
      engine.entities[query[0]][MeshComponent.id],
      MeshComponent,
    );
    this.meshTransform = engine.ecs.getComponentValues(
      this.meshTransformComponentId,
      TransformComponent,
    );

    const mesh_meshId_Accesor = engine.ecs.createFieldAccessor(
      MeshComponent,
      "meshId",
    );
    this.mesh_meshId_Accesor = mesh_meshId_Accesor;

    const cameraEntity = engine.query(CameraComponent, TransformComponent)[0];

    console.log(
      cameraEntity,
      engine.entities[cameraEntity],
      CameraComponent.id,
      TransformComponent.id,
      engine.entities[cameraEntity][CameraComponent.id],
    );

    this.cameraComponentId = engine.entities[cameraEntity][CameraComponent.id];
    this.cameraTransformComponentId =
      engine.entities[cameraEntity][TransformComponent.id];

    // engine.query(MaterialComponent).forEach((entity) => {
    //   const materialComp = entity.getComponent(MaterialComponent)!;
    //   materialComp.material.start();
    // });
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

    // Write the matrix back to the ECS
    engine.ecs.setComponentValue(
      componentId,
      TransformComponent,
      "matrix",
      transformMatrix,
    );
  }

  constructor(canvas: HTMLCanvasElement, Material) {
    super();
    this.renderer = new Renderer(canvas);
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
    return this.renderer.uploadMesh(cubeData.vertices, cubeData.indices);
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
