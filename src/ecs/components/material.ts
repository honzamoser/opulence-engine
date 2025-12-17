import { hot } from "../../opulence-ecs/component-gen";
import { Material } from "../../renderer/material";
import { Component } from "../component";

export default class MaterialComponent implements Component {
  @hot.int32
  materialId: number;
}
