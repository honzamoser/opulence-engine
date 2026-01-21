import { Vec3, mat4, vec3 } from "wgpu-matrix";
import { System } from "../system";
import { Engine } from "../../engine";
import { Helios2Renderer } from "../../renderer/renderer";
import { namespace } from "../component-gen";
import { MeshComponent, TransformComponent } from "@generated";

@namespace("builtin.render.RenderSystem")
export default class RenderSystem extends System {

  renderer: Helios2Renderer;
  matCalcScratchpad: Float32Array = new Float32Array(16);

  update_scratchPad = {
    matrix: mat4.create(),
  }

  public override async update(entities: number[][], delta: number, engine: Engine) {
    this.renderer.render(delta);

    engine.query(MeshComponent, TransformComponent).forEach((entity) => {

      const meshId = engine.entities[entity][MeshComponent.IDENTIFIER];
      const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];

      const transform = TransformComponent.to(
        transformId
      );
      const mesh = MeshComponent.to(
        meshId
      );

      if (mesh.meshId === 0) {
        this.instantiate(engine, entity);
        return;
      }


      this.calculateTransformMatrix(transform);
      this.renderer._updateMatrix(mesh.meshId, this.calculateTransformMatrix_Scratchpad.matrix);

      transform.matrix = this.calculateTransformMatrix_Scratchpad.matrix;
    });

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
    const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];
    const transform = TransformComponent.to(transformId);
    const mesh = MeshComponent.to(engine.entities[entity][MeshComponent.IDENTIFIER])

    this.calculateTransformMatrix(transform);
    transform.cpy_matrix(this.instantiatScratchpad.matrix);
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
    matrix: mat4.create(),

    positionVec3: vec3.create(),
    rotationVec3: vec3.create(),
    scaleVec3: vec3.create(),
  }

  calculateTransformMatrix(
    t: typeof TransformComponent,
  ) {
    // const translationMatrix = mat4.translation(t.position, mat4.create());

    t.cpy_position(this.calculateTransformMatrix_Scratchpad.positionVec3);
    t.cpy_rotation(this.calculateTransformMatrix_Scratchpad.rotationVec3);
    t.cpy_scale(this.calculateTransformMatrix_Scratchpad.scaleVec3);


    const translationMatrix = mat4.translation(this.calculateTransformMatrix_Scratchpad.positionVec3, this.calculateTransformMatrix_Scratchpad.translationMatrix);
    const rotationXMatrix = mat4.rotationX(this.calculateTransformMatrix_Scratchpad.rotationVec3[0], this.calculateTransformMatrix_Scratchpad.rotationXMatrix);
    const rotationYMatrix = mat4.rotationY(this.calculateTransformMatrix_Scratchpad.rotationVec3[1], this.calculateTransformMatrix_Scratchpad.rotationYMatrix);
    const rotationZMatrix = mat4.rotationZ(this.calculateTransformMatrix_Scratchpad.rotationVec3[2], this.calculateTransformMatrix_Scratchpad.rotationZMatrix);
    const scaleMatrix = mat4.scaling(this.calculateTransformMatrix_Scratchpad.scaleVec3, this.calculateTransformMatrix_Scratchpad.scaleMatrix);

    let rotationMatrix = mat4.multiply(rotationYMatrix, rotationXMatrix);
    rotationMatrix = mat4.multiply(rotationZMatrix, rotationMatrix);
    let transformMatrix = mat4.multiply(translationMatrix, rotationMatrix);
    transformMatrix = mat4.multiply(transformMatrix, scaleMatrix);


    t.matrix = transformMatrix;
    this.calculateTransformMatrix_Scratchpad.matrix = transformMatrix;
  }

  constructor(renderer: Helios2Renderer) {
    super();
    this.renderer = renderer;
  }
}

