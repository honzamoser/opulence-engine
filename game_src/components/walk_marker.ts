import { Component } from "../../src/types/component";

export class WalkMarker extends Component {
    timer: number = 0;

    update(delta: number): void {
        this.timer += delta;

        if(this.timer > 1000) {
            
        }
    }
}