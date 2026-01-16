import { vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { cold, constructor, hot } from "../component-gen";

export default class RigidbodyComponent extends Component {
    @hot.float32
    @constructor(0)
    mass: number = 1;

    @hot.float32Array(3)
    velocity: Vec3 = vec3.zero();

    @cold.float32Array
    vertices: Float32Array;
}