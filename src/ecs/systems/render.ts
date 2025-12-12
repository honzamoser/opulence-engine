import { Vec3, mat4, vec3 } from "wgpu-matrix";
import { Entity } from "../../entity";
import { Light } from "../../renderer/light";
import { MeshComponent } from "../components/mesh";
import { TransformComponent } from "../components/transform";
import { System } from "../system";
import { Engine } from "../../engine";
import { Renderer } from "../../renderer/renderer";

export class RenderSystem extends System {
  renderer: Renderer;

  public async update(entities: Entity[], delta: number, engine: Engine) {
    this.renderer.render(
      entities
        .filter(
          (x) =>
            x.components.find((x) => x instanceof MeshComponent) &&
            x.components.find((x) => x instanceof TransformComponent),
        )
        .map((entity) => {
          const meshComp = entity.components.find(
            (x) => x instanceof MeshComponent,
          ) as MeshComponent;
          return { entity, mesh: meshComp.mesh };
        }),
      delta,
      engine.cameraPosition,
    );
  }

  public async start(engine: Engine) {
    await this.renderer.initialize();

    console.log(this.renderer);
  }

  constructor(canvas: HTMLCanvasElement, shaderSource: string) {
    super();
    this.renderer = new Renderer(canvas, shaderSource);
  }
}
