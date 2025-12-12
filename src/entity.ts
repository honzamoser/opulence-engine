import {
  vec2,
  Mat4,
  Quat,
  Vec2,
  Vec2Type,
  Vec3,
  vec3,
  mat4,
} from "wgpu-matrix";
import { Engine } from "./engine";
// import { Component } from "./render/types/component";
import { Mesh } from "./renderer/mesh";
import { Component } from "./ecs/component";
import { System } from "./ecs/system";

export class Entity {
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  transform: Mat4;
  world: Engine;

  components: Component[] = [];

  constructor(
    world: Engine,
    position: Vec3 = vec3.create(0, 0, 0),
    rotation: Vec3 = vec3.create(0, 0),
    scale: Vec3 = vec3.create(1, 1, 1),
  ) {
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.world = world;
    this.transform = mat4.identity();
    this.computeTransform();
  }

  computeTransform() {
    mat4.identity(this.transform);
    mat4.translate(this.transform, this.position, this.transform);
    mat4.rotateX(this.transform, this.rotation[0], this.transform);
    mat4.rotateY(this.transform, this.rotation[1], this.transform);
    mat4.rotateZ(this.transform, this.rotation[2], this.transform);
    mat4.scale(this.transform, this.scale, this.transform);
  }
}
