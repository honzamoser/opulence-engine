import { Vec3, mat4, vec3 } from "wgpu-matrix";
import MeshComponent from "../components/mesh.component";
import TransformComponent from "../components/transform.component";
import { System } from "../system";
import { Engine } from "../../engine";
import { Helios2Renderer } from "../../renderer/renderer";
import { namespace } from "../component-gen";

@namespace("builtin.render.RenderSystem")
export default class RenderSystem extends System {

  renderer: Helios2Renderer;

  public override async update(entities: number[][], delta: number, engine: Engine) {
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
}

