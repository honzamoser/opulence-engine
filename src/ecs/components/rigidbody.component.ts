import { vec3, Vec3 } from "wgpu-matrix";
import { Component } from "../component";
import { cold, constructor, hot } from "../component-gen";
import {PointerTo, SizeOf} from "../../../compiler/component_parsers"

export default class RigidbodyComponent extends Component {
    mass: number = 1;
    isStatic: boolean = false;

    bodyId: number = -1;
}