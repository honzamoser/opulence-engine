import { Mesh } from "../../renderer/mesh";
import { createCube } from "../../renderer/primitive";
import { Component } from "../component";

export class MeshComponent extends Component {
  mesh: Mesh;

  constructor(device: GPUDevice) {
    super();
    this.mesh = createCube(device);
  }
}
