import { vec2, vec3 } from "wgpu-matrix";
import { CameraComponent } from "../../src/ecs/components/camera";
import { MeshComponent } from "../../src/ecs/components/mesh";
import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { Entity } from "../../src/entity";
import {
  createRayFromMouse,
  rayIntersectEntity,
} from "../../src/physics/raycast";
import { InputComponent } from "../components/input";
import { PlayerComponent } from "../components/player";
import { TransformComponent } from "../../src/ecs/components/transform";

export class PlayerSystem extends System {
  public start(engine: Engine): Promise<void> {
    return;
  }

  cameraHold = vec3.create();
  zoomFactor = 1;

  public update(
    entities: Entity[],
    delta: number,
    engine: Engine,
  ): Promise<void> {
    const player = engine.query(
      PlayerComponent,
      InputComponent,
      MeshComponent,
    )[0];
    if (!player) return;

    const input = player.getComponent(InputComponent)!;
    const playerComp = player.getComponent(PlayerComponent)!;
    const playerTransform = player.getComponent(TransformComponent)!;
    const camera = engine.query(CameraComponent)[0];

    const cameraCamera = camera.getComponent(CameraComponent)!;
    const cameraTransform = camera.getComponent(TransformComponent)!;

    if (input.clickedRMB) {
      this.cameraHold = vec3.clone(cameraTransform.position);
    }

    if (input.LMB) {
      const ray = createRayFromMouse(
        vec2.create(input.mousePosition.x, input.mousePosition.y),
        vec2.create(engine.canvas.width, engine.canvas.height),
        cameraCamera.projectionMatrix,
        cameraTransform.position,
      );

      const castingEntities = engine.query(MeshComponent, TransformComponent);
      console.log(castingEntities);
      for (let entity of castingEntities) {
        if (entity === player) continue; // Skip self

        const hit = rayIntersectEntity(
          ray,
          entity.getComponent(TransformComponent)!,
          entity.getComponent(MeshComponent)!,
        );
        if (hit) {
          const transform = entity.getComponent(TransformComponent)!;
          playerComp.destination = vec3.add(hit.point, vec3.create(0, 1, 0));
          break; // Stop after the first hit
        }
      }
    }

    if (input.RMB) {
      // Pan camera in absolute world space (X and Z axes only)
      const deltaX = input.mousePosition.x - input.RMBStart.x;
      const deltaY = -input.mousePosition.y + input.RMBStart.y;

      const sensitivity = 0.01 * this.zoomFactor;

      // Move in pure world space - ignore camera rotation completely
      cameraTransform.position[0] = this.cameraHold[0] - deltaX * sensitivity;
      cameraTransform.position[1] = this.cameraHold[1]; // Keep height constant
      cameraTransform.position[2] = this.cameraHold[2] + deltaY * sensitivity;

      cameraTransform.computeTransform();
    }

    if (input.scrolled) {
      // Zoom camera in and out along camera's local Z axis (forward/backward)
      const zoomAmount = input.scrolled * 0.01;

      // Calculate camera's forward direction from rotation
      const pitch = cameraTransform.rotation[0];
      const yaw = cameraTransform.rotation[1];

      const forwardX = Math.sin(yaw) * Math.cos(pitch);
      const forwardY = -Math.sin(pitch);
      const forwardZ = Math.cos(yaw) * Math.cos(pitch);

      // Move along camera's forward axis
      cameraTransform.position[0] += forwardX * zoomAmount;
      cameraTransform.position[1] += forwardY * zoomAmount;
      cameraTransform.position[2] += forwardZ * zoomAmount;

      cameraTransform.computeTransform();
      input.scrolled = 0; // Reset scroll

      this.zoomFactor += zoomAmount * 0.1;
    }

    if (playerComp.destination) {
      let distance = vec3.distance(
        playerComp.destination,
        playerTransform.position,
      );

      console.log(
        "moving player to ",
        playerComp.destination,
        " distance: ",
        distance,
        "current: ",
        playerTransform.position,
      );

      if (distance > 0.1) {
        let direction = vec3.subtract(
          playerComp.destination,
          playerTransform.position,
        );
        vec3.normalize(direction, direction);

        let moveDistance = playerComp.speed * delta;
        if (moveDistance > distance) {
          moveDistance = distance; // Don't overshoot
        }

        let movement = vec3.mulScalar(direction, moveDistance);
        playerTransform.position = vec3.add(playerTransform.position, movement);

        playerTransform.computeTransform();
      } else {
        playerComp.destination = null;
      }
    }
  }
}
