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

export class RenderSystem extends System {
  materials: Material[] = [];

  registerMaterial(defaultMaterial: Material) {
    this.materials.push(defaultMaterial);
  }
  renderer: Renderer;

  public async update(entities: Entity[], delta: number, engine: Engine) {
    if (!this.renderer.ready) return;
    const camera = engine.query(CameraComponent)[0];

    const cameraComponent = camera.getComponent(CameraComponent);
    const transformComponent = camera.getComponent(TransformComponent);

    this.renderer.render(
      engine.query(MeshComponent, TransformComponent).map((entity) => {
        const meshComp = entity.getComponent(MeshComponent)!;
        const transformComp = entity.getComponent(TransformComponent)!;
        return {
          entity,
          mesh: meshComp.mesh,
          transform: transformComp,
          material: meshComp.mesh.material,
        };
      }),
      delta,
      transformComponent.position,
      cameraComponent.projectionMatrix,
    );
  }

  public async start(engine: Engine) {
    await this.renderer.initialize();

    this.materials.forEach((x) => x.start());

    engine.query(MeshComponent).forEach((entity) => {
      const meshComp = entity.getComponent(MeshComponent)!;
      meshComp.mesh.start(this.renderer.device);
    });

    engine.query(MaterialComponent).forEach((entity) => {
      const materialComp = entity.getComponent(MaterialComponent)!;
      materialComp.material.start();
    });
  }

  constructor(canvas: HTMLCanvasElement, Material) {
    super();
    this.renderer = new Renderer(canvas);
  }
}
