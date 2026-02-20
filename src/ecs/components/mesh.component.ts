import { vec3, Vec3 } from "wgpu-matrix";
import { constructor, hot } from "../component-gen";
import { Component } from "../component";
import { SizeOf } from "compiler/component_parsers";

export default class MeshComponent extends Component {
  meshId: number;

  rendererdInstasnceId: number;

  color: Vec3;

  resourceIdentifier: SizeOf<string, 64>;

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
