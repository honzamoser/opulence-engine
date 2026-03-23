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

  cameraPosition = vec3.create(0, 5, 5);
  cameraRotation = vec3.create(0, 0, 0);

  update_scratchPad = {
    matrix: mat4.create(),
  }

  private readonly batchScratchpad = {
    groups: new Map<number, { meshComponentId: number; matrix: Float32Array; color: Float32Array }[]>(),
  }

  private disabledEntities: Set<number> = new Set();

  private orbitRadius = 20;
  private orbitSpeed = 0.5;

  public override async update(entities: number[][], delta: number, engine: Engine) {
    const plug = (window as any).plug;
    if (plug) {
      if (typeof plug.orbitRadius === "number") {
        this.orbitRadius = Math.max(1, Math.min(500, plug.orbitRadius));
      }
      if (typeof plug.orbitSpeed === "number") {
        this.orbitSpeed = Math.max(0, Math.min(10, plug.orbitSpeed));
      }
      if (typeof plug.camera_fov === "number") {
        this.renderer.fov = Math.max(5, Math.min(170, plug.camera_fov));
      }
    }

    this.batchScratchpad.groups.clear();

    engine.query(MeshComponent, TransformComponent).forEach((entity) => {
      if (this.disabledEntities.has(entity)) {
        return;
      }

      const meshId = engine.entities[entity][MeshComponent.IDENTIFIER];
      const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];


      const transform = TransformComponent.to(
        transformId
      );
      const mesh = MeshComponent.to(
        meshId
      );

      this.calculateTransformMatrix(transform);
      transform.matrix = this.calculateTransformMatrix_Scratchpad.matrix;

      if (mesh.rendererdInstasnceId === 0) {
        if (transform.batch) {
          const group = this.batchScratchpad.groups.get(mesh.meshId) ?? [];
          group.push({
            meshComponentId: meshId,
            matrix: new Float32Array(this.calculateTransformMatrix_Scratchpad.matrix),
            color: new Float32Array([mesh.color[0], mesh.color[1], mesh.color[2], 1]),
          });
          this.batchScratchpad.groups.set(mesh.meshId, group);
          return;
        }

        this.instantiate(engine, entity, mesh.color);
        return;
      }

      this.renderer._updateMatrix(mesh.rendererdInstasnceId, this.calculateTransformMatrix_Scratchpad.matrix);
    });

    for (const [meshId, group] of this.batchScratchpad.groups.entries()) {
      if (group.length === 0) continue;

      const startInstance = this.renderer._instantiateBatch(
        meshId,
        group.map((x) => ({ matrix: x.matrix, color: x.color })),
      );

      for (let i = 0; i < group.length; i++) {
        MeshComponent.to(group[i].meshComponentId).rendererdInstasnceId = startInstance + i + 1;
      }
    }

    // Orbit camera around the world origin and keep it looking at the center.

    const orbitHeight = 2;
    const orbitAngle = (Date.now() / 1000) * this.orbitSpeed;

    this.cameraPosition[0] = Math.sin(orbitAngle) * this.orbitRadius;
    this.cameraPosition[1] = orbitHeight;
    this.cameraPosition[2] = Math.cos(orbitAngle) * this.orbitRadius;

    const toCenterX = -this.cameraPosition[0];
    const toCenterY = -this.cameraPosition[1];
    const toCenterZ = -this.cameraPosition[2];
    const horizontalDistance = Math.hypot(toCenterX, toCenterZ);

    // Renderer expects Euler angles in degrees.
    this.cameraRotation[0] = -(Math.atan2(toCenterY, horizontalDistance) * 180 / Math.PI);
    this.cameraRotation[1] = Math.atan2(toCenterX, -toCenterZ) * 180 / Math.PI;
    this.cameraRotation[2] = 0;

    

    this.renderer.cameraPosition = this.cameraPosition;
    this.renderer.cameraRotation = this.cameraRotation;

    this.renderer.render(delta);


  }

  public async start(engine: Engine) {
    const meshEntities = engine.query(MeshComponent, TransformComponent);

    const plug = (window as any).plug ?? ((window as any).plug = {});
    if (typeof plug.orbitRadius !== "number") plug.orbitRadius = this.orbitRadius;
    if (typeof plug.orbitSpeed !== "number") plug.orbitSpeed = this.orbitSpeed;
    if (typeof plug.camera_fov !== "number") plug.camera_fov = this.renderer.fov;

    plug.changeColor = (meshId: number, color: Float32Array) => {
      const mesh = MeshComponent.to(meshId);
      mesh.color = color;
      this.renderer._changeInstanceColor(mesh.rendererdInstasnceId, new Float32Array([...color, 1]));
    }
  }

  instantiatScratchpad = {
    matrix: mat4.create(),
  }

  private instantiate(engine: Engine, entity: number, color?: Float32Array) {
    const transformId = engine.entities[entity][TransformComponent.IDENTIFIER];
    const transform = TransformComponent.to(transformId);
    const mesh = MeshComponent.to(engine.entities[entity][MeshComponent.IDENTIFIER])


    this.calculateTransformMatrix(transform);
    transform.cpy_matrix(this.instantiatScratchpad.matrix);
    mesh.rendererdInstasnceId = this.renderer._instantiate(
      0,
      this.instantiatScratchpad.matrix,
      color ? new Float32Array([...color, 1]) : new Float32Array([1, 1, 1, 1])
    ) + 1;
  }

  public setEntityRenderEnabled(engine: Engine, entity: number, enabled: boolean) {
    const meshId = engine.entities[entity]?.[MeshComponent.IDENTIFIER];
    const transformId = engine.entities[entity]?.[TransformComponent.IDENTIFIER];
    if (meshId === undefined || transformId === undefined) {
      return;
    }

    const transform = TransformComponent.to(transformId);
    const mesh = MeshComponent.to(meshId);

    if (enabled) {
      this.disabledEntities.delete(entity);
      if (mesh.rendererdInstasnceId === 0) {
        this.instantiate(engine, entity, mesh.color);
      }
      this.calculateTransformMatrix(transform);
      this.renderer._setInstanceEnabled(
        mesh.rendererdInstasnceId,
        true,
        this.calculateTransformMatrix_Scratchpad.matrix,
      );
      return;
    }

    this.disabledEntities.add(entity);
    if (mesh.rendererdInstasnceId !== 0) {
      this.renderer._setInstanceEnabled(mesh.rendererdInstasnceId, false);
    }
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

  constructor(renderer: Helios2Renderer, radiusDistance: number = 20) {
    super();
    this.renderer = renderer;
    this.orbitRadius = radiusDistance;
  }
}

