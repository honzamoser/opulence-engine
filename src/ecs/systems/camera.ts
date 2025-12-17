import { mat4, vec3, Vec3 } from "wgpu-matrix";
import { Engine } from "../../engine";
import { Entity } from "../../entity";
import CameraComponent from "../components/camera";
import { System } from "../system";
import TransformComponent from "../components/transform";

export class CameraSystem extends System {
  public update(
    entities: Entity[],
    delta: number,
    engine: Engine,
  ): Promise<void> {
    const camera = engine.query(CameraComponent, TransformComponent)[0];

    const cameraComponent = camera.getComponent(CameraComponent)!;
    const transformComponent = camera.getComponent(TransformComponent)!;

    cameraComponent.projectionMatrix = this.getViewProjectionMatrix(
      cameraComponent,
      transformComponent,
      engine,
    );
  }

  getViewProjectionMatrix(
    camera: CameraComponent,
    transform: TransformComponent,
    engine: Engine,
  ): Float32Array<ArrayBufferLike> {
    const aspect = engine.canvas.width / engine.canvas.height;
    const projection = mat4.perspective(
      camera.fov,
      aspect,
      camera.near,
      camera.far,
    );

    // Create view matrix from transform
    // View matrix is the inverse of the camera's transform matrix
    const view = mat4.identity();

    // First apply inverse rotations in reverse order (Z, Y, X)
    mat4.rotateZ(view, -transform.rotation[2], view);
    mat4.rotateY(view, -transform.rotation[1], view);
    mat4.rotateX(view, -transform.rotation[0], view);

    // Then translate to camera position (negated because we're moving the world)
    mat4.translate(view, vec3.negate(transform.position), view);

    const viewProjection = mat4.multiply(projection, view);
    return viewProjection;
  }
}
