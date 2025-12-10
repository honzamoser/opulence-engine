import { Entity } from "../../src/entity";
import { Engine } from "../../src/engine";
import { Component } from "../../src/types/component";

export class CharacterComponent extends Component {
    moveTarget: { x: number, y: number } = { x: 0, y: 0 };
    world: Engine;

    event: EventTarget = new EventTarget();

    moveDirection: "left" | "right" = "left"

    update(delta: number): void {
        const distanceX = this.moveTarget.x - this.parent.position.x;
        const distanceY = this.moveTarget.y - this.parent.position.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

        const speed = 0.1; // pixels per millisecond

        if (distance > 1) {

            const moveX = (distanceX / distance) * speed * delta;
            const moveY = (distanceY / distance) * speed * delta;

            this.parent.position.x += moveX;
            this.parent.position.y += moveY;
        } else {
            this.parent.position.x = this.moveTarget.x;
            this.parent.position.y = this.moveTarget.y;
            this.event.dispatchEvent(new Event('stopmove'));
        }


    }

    constructor(parent: Entity, world: Engine) {
        super(parent);
        this.world = world;


        world.input.events.addEventListener('contextmenu', async (e) => {
            const targetX = (e as CustomEvent).detail.clientX + world.cameraPosition.x
            const targetY = (e as CustomEvent).detail.clientY + world.cameraPosition.y

            this.moveTarget.x = targetX;
            this.moveTarget.y = targetY;

            this.event.dispatchEvent(new Event('move'));

            if (targetX > this.parent.position.x) {
                this.moveDirection = "right"
            } else {
                this.moveDirection = "left"
            }

        });
    }

}