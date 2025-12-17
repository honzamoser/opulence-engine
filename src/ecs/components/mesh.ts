import { vec3, Vec3 } from "wgpu-matrix";
import { constructor, hot } from "../../opulence-ecs/component-gen";
import { Mesh } from "../../renderer/mesh";
import { createCube } from "../../renderer/primitive";
import { Component } from "../component";

export default class MeshComponent extends Component {
  @hot.int32
  meshId: number;

  @hot.string(64)
  @constructor(0)
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
