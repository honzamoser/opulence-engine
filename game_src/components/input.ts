import { Component } from "../../src/ecs/component";

export class InputComponent extends Component {
  LMB: boolean = false;
  RMB: boolean = false;
  MMB: boolean = false;
  mousePosition = { x: 0, y: 0 };

  LMBStart = { x: 0, y: 0 };
  RMBStart = { x: 0, y: 0 };
  MMBStart = { x: 0, y: 0 };

  clickedRMB: boolean = false;
  clickedLMB: boolean = false;
  clickedMMB: boolean = false;

  scrolled: number = 0;

  constructor() {
    super();
  }
}
