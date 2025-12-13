import { Mesh } from "../../renderer/mesh";
import { createCube } from "../../renderer/primitive";
import { Component } from "../component";

export class MeshComponent extends Component {
  mesh: Mesh;

  constructor(mesh: Mesh) {
    super();
    this.mesh = mesh;
  }
}
