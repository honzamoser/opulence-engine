import { Vec3, mat4, vec3 } from "wgpu-matrix";
import MeshComponent from "../components/mesh.component";
import TransformComponent from "../components/transform.component";
import { System } from "../system";
import { Engine } from "../../engine";
import { Helios2Renderer } from "../../renderer/renderer";
import { namespace } from "../component-gen";
import { MeshComponentAccessor, TransformComponentAccessor } from "virtual:ecs";

@namespace("builtin.render.RenderSystem")
export default class RenderSystem extends System {

  renderer: Helios2Renderer;
  matCalcScratchpad: Float32Array = new Float32Array(16);

  update_scratchPad = {
    matrix: mat4.create(),
  }

  public override async update(entities: number[][], delta: number, engine: Engine) {
    engine.query(MeshComponent, TransformComponent).forEach((entity) => {

      console.log(engine.entities[entity][MeshComponent.id])

      const meshId = engine.entities[entity][MeshComponent.id];
      const transformId = engine.entities[entity][TransformComponent.id];

      const transform: TransformComponentAccessor = engine.ecs.getAccesor(
        transformId,
        TransformComponent,
      );
      const mesh: MeshComponent = engine.ecs.getAccesor(
        meshId,
        MeshComponent,
      );

      if (mesh.meshId === 0) {
        this.instantiate(engine, entity);
        return;
      }

      transform.getMatrix(this.update_scratchPad.matrix);

      console.log(this.update_scratchPad.matrix);

      this.calculateTransformMatrix(transform);
      this.renderer._updateMatrix(mesh.meshId, this.update_scratchPad.matrix);
    });

    this.renderer.render(delta);
  }

  public async start(engine: Engine) {
    const meshEntities = engine.query(MeshComponent, TransformComponent);

    meshEntities.forEach((entity) => {
      this.instantiate(engine, entity);
    });
  }

  instantiatScratchpad = {
    matrix: mat4.create(),
  }

  private instantiate(engine: Engine, entity: number) {
    const transformId = engine.entities[entity][TransformComponent.id];
    const transform: TransformComponentAccessor = engine.ecs.getAccesor(
      transformId,
      TransformComponent
    );
    const mesh: MeshComponentAccessor = engine.ecs.getAccesor(
      engine.entities[entity][MeshComponent.id],
      MeshComponent
    );

    console.log(transform, mesh)

    this.calculateTransformMatrix(transform);
    transform.getMatrix(this.instantiatScratchpad.matrix);
    mesh.meshId = this.renderer._instantiate(
      0,
      this.instantiatScratchpad.matrix,
      new Float32Array([1, 1, 1, 1])
    ) + 1;
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

  calculateTransformMatrix_Scratchpad = {
    translationMatrix: mat4.create(),
    rotationXMatrix: mat4.create(),
    rotationYMatrix: mat4.create(),
    rotationZMatrix: mat4.create(),
    scaleMatrix: mat4.create(),
    rotationMatrix: mat4.create(),
    transformMatrix: mat4.create(),

    positionVec3: vec3.create(),
    rotationVec3: vec3.create(),
    scaleVec3: vec3.create(),
  }

  calculateTransformMatrix(
    t: TransformComponentAccessor,
  ) {
    // const translationMatrix = mat4.translation(t.position, mat4.create());

    t.getPosition(this.calculateTransformMatrix_Scratchpad.positionVec3);
    t.getRotation(this.calculateTransformMatrix_Scratchpad.rotationVec3);
    t.getScale(this.calculateTransformMatrix_Scratchpad.scaleVec3);

    console.log(this.calculateTransformMatrix_Scratchpad.positionVec3);


    const translationMatrix = mat4.translation(this.calculateTransformMatrix_Scratchpad.translationMatrix, this.calculateTransformMatrix_Scratchpad.positionVec3);
    const rotationXMatrix = mat4.rotationX(this.calculateTransformMatrix_Scratchpad.rotationVec3[0], this.calculateTransformMatrix_Scratchpad.rotationXMatrix);
    const rotationYMatrix = mat4.rotationY(this.calculateTransformMatrix_Scratchpad.rotationVec3[1], this.calculateTransformMatrix_Scratchpad.rotationYMatrix);
    const rotationZMatrix = mat4.rotationZ(this.calculateTransformMatrix_Scratchpad.rotationVec3[2], this.calculateTransformMatrix_Scratchpad.rotationZMatrix);
    const scaleMatrix = mat4.scaling(this.calculateTransformMatrix_Scratchpad.scaleVec3, this.calculateTransformMatrix_Scratchpad.scaleMatrix);

    let rotationMatrix = mat4.multiply(rotationYMatrix, rotationXMatrix);
    rotationMatrix = mat4.multiply(rotationZMatrix, rotationMatrix);

    let transformMatrix = mat4.multiply(translationMatrix, rotationMatrix);
    transformMatrix = mat4.multiply(transformMatrix, scaleMatrix);

    t.setMatrix(transformMatrix);
  }

  constructor(renderer: Helios2Renderer) {
    super();
    this.renderer = renderer;
  }
}

