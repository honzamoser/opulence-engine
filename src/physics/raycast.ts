import { mat4, Mat4, Vec2, vec3, Vec3, vec4 } from "wgpu-matrix";
import { Entity } from "../entity";
import { TransformComponent } from "../ecs/components/transform";
import { Mesh } from "../renderer/mesh";
import { MeshComponent } from "../ecs/components/mesh";

export class Ray {
  origin: Vec3;
  direction: Vec3;

  constructor(origin: Vec3, direction: Vec3) {
    this.origin = origin;
    this.direction = direction;
  }
}

export interface HitResult {
  distance: number;
  point: Vec3;
}

export function createRayFromMouse(
  mouse: Vec2,
  canvas: Vec2,
  viewProjectionMatrix: Mat4,
  cameraPosition: Vec3,
) {
  const x = (2.0 * mouse[0]) / canvas[0] - 1.0;
  const y = 1.0 - (2.0 * mouse[1]) / canvas[1];

  const invVP = mat4.invert(viewProjectionMatrix);

  const clipCoords = vec4.create(x, y, 1, 1);

  const worldCoords = vec4.transformMat4(clipCoords, invVP);

  const worldPoint = vec3.create(
    worldCoords[0] / worldCoords[3],
    worldCoords[1] / worldCoords[3],
    worldCoords[2] / worldCoords[3],
  );

  const dir = vec3.subtract(worldPoint, cameraPosition);
  vec3.normalize(dir, dir);

  return new Ray(cameraPosition, dir);
}

export function rayIntersectEntity(
  ray: Ray,
  transform: TransformComponent,
  mesh: MeshComponent,
): HitResult | null {
  // 1. Get World Bounds

  const scaledMin = vec3.multiply(mesh.mesh.AABB.min, transform.scale);
  const scaledMax = vec3.multiply(mesh.mesh.AABB.max, transform.scale);

  const minWorld = vec3.add(scaledMin, transform.position);
  const maxWorld = vec3.add(scaledMax, transform.position);

  // 2. Slab Method (Distance Calculation)
  let tMin = (minWorld[0] - ray.origin[0]) / ray.direction[0];
  let tMax = (maxWorld[0] - ray.origin[0]) / ray.direction[0];

  if (tMin > tMax) [tMin, tMax] = [tMax, tMin];

  let tyMin = (minWorld[1] - ray.origin[1]) / ray.direction[1];
  let tyMax = (maxWorld[1] - ray.origin[1]) / ray.direction[1];

  if (tyMin > tyMax) [tyMin, tyMax] = [tyMax, tyMin];

  if (tMin > tyMax || tyMin > tMax) return null;

  if (tyMin > tMin) tMin = tyMin;
  if (tyMax < tMax) tMax = tyMax;

  let tzMin = (minWorld[2] - ray.origin[2]) / ray.direction[2];
  let tzMax = (maxWorld[2] - ray.origin[2]) / ray.direction[2];

  if (tzMin > tzMax) [tzMin, tzMax] = [tzMax, tzMin];

  if (tMin > tzMax || tzMin > tMax) return null;

  if (tzMin > tMin) tMin = tzMin;
  if (tzMax < tMax) tMax = tzMax;

  // 3. Final Verification
  // tMin is the distance to enter the box.
  // If tMin < 0, the intersection is behind the camera (or we are inside the box).
  if (tMax < 0) return null;

  // If tMin is negative but tMax is positive, we are inside the object.
  // We usually want the 'exit' point or just 0, but let's take tMin if valid.
  const finalDistance = tMin < 0 ? tMax : tMin;

  // 4. Calculate Point: P = O + D * t
  const hitPoint = vec3.add(
    ray.origin,
    vec3.scale(ray.direction, finalDistance),
  );

  return {
    distance: finalDistance,
    point: hitPoint,
  };
}
