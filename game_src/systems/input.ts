import { System } from "../../src/ecs/system";
import { Engine } from "../../src/engine";
import { Entity } from "../../src/entity";
import { InputComponent } from "../components/input";

export class InputSystem extends System {
  public start(engine: Engine): Promise<void> {
    let components = engine
      .query(InputComponent)
      .map((x) => x.getComponent(InputComponent));

    window.addEventListener("mousemove", (ev) => {
      components.forEach((x) => {
        x.mousePosition = { x: ev.clientX, y: ev.clientY };
      });
    });

    window.addEventListener("mousedown", (ev) => {
      components.forEach((x) => {
        if (x.LMB != true && ev.button === 0) x.clickedLMB = true;
        if (x.RMB != true && ev.button === 2) x.clickedRMB = true;
        if (x.MMB != true && ev.button === 1) x.clickedMMB = true;

        x.LMB = ev.button === 0;
        x.RMB = ev.button === 2;
        x.MMB = ev.button === 1;

        if (ev.button === 0) {
          x.LMBStart = { x: ev.clientX, y: ev.clientY };
        }

        if (ev.button === 2) {
          x.RMBStart = { x: ev.clientX, y: ev.clientY };
        }

        if (ev.button === 1) {
          x.MMBStart = { x: ev.clientX, y: ev.clientY };
        }

        x.mousePosition = { x: ev.clientX, y: ev.clientY };
      });
    });

    window.addEventListener("wheel", (ev) => {
      components.forEach((x) => {
        x.scrolled = ev.deltaY;
      });
    });

    window.addEventListener("mouseup", (ev) => {
      components.forEach((x) => {
        if (ev.button === 0) x.LMB = false;
        if (ev.button === 2) x.RMB = false;
        if (ev.button === 1) x.MMB = false;

        x.mousePosition = { x: ev.clientX, y: ev.clientY };
      });
    });
  }

  public afterUpdate(engine: Engine): Promise<void> {
    let components = engine
      .query(InputComponent)
      .map((x) => x.getComponent(InputComponent));

    components.forEach((x) => {
      x.clickedLMB = false;
      x.clickedRMB = false;
      x.clickedMMB = false;
      x.scrolled = 0;
    });
  }
}
