import { vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { cold, constructor, hot } from "../component-gen";
import {PointerTo} from "../../../component_parsers"

export default class RigidbodyComponent extends Component {
    mass: number = 1;

    velocity: Vec3 = vec3.zero();

    vertices: PointerTo<Float32Array> = { ptr: undefined, ptr_len: 0 };
}