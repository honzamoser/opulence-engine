import { hot } from "../component-gen";
import { Component } from "../component";

export default class MaterialComponent extends Component {
  @hot.int32
  materialId: number;
}
