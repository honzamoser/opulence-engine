import { hot } from "../../opulence-ecs/component-gen";
import { Mesh } from "../../renderer/mesh";
import { createCube } from "../../renderer/primitive";
import { Component } from "../component";

export default class MeshComponent extends Component {
  @hot.int32
  meshId: number;
}
