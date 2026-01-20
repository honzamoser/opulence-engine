import { vec3, Vec3 } from "wgpu-matrix";
import { constructor, hot } from "../component-gen";
import { Component } from "../component";

export default class MeshComponent extends Component {
  meshId: number;

  rendererdInstasnceId: number;

  resourceIdentifier: string;

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
