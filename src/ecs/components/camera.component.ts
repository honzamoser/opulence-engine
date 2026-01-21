import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { hot } from "../component-gen";

export class CameraComponent  {
  fov: number = Math.PI / 2;
  near: number = 0.1;
  far: number = 1000;

  position: Vec3;
  rotation: Vec3;

  projectionMatrix: Mat4 = mat4.create();
}
