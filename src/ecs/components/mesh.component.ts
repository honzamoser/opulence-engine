import { vec3, Vec3 } from "wgpu-matrix";
import { constructor, hot } from "../component-gen";
import { Component } from "../component";

export default class MeshComponent extends Component {
  @hot.int32
  @constructor(0)
  meshId: number;

  @hot.int32
  rendererdInstasnceId: number;

  @hot.string(64)
  resourceIdentifier: string;

  @hot.float32Array(3)
  boundingBoxMin: Vec3 = vec3.create(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  );

  @hot.float32Array(3)
  boundingBoxMax: Vec3 = vec3.create(
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  );
}
