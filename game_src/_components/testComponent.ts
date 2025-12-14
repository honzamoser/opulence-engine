import { int32 } from "@deepkit/type";
import { Component } from "../../src/ecs/component";

export default class TestComponent extends Component {
  number_value: int32 = -15;
  text_value: string = "Hello, World!";
  bool_value: boolean = true;
  class_value: test = new test();
  array_value: int32[] = [1, 2, 3, 4, 5];
}

export class test {
  test: string = "Ahojda";
}
