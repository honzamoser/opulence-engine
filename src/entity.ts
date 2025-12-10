import { Engine } from "./engine";
import { Component } from "./types/component";
import { Vector2 } from "./types/vector2";

export class Entity {
    position: Vector2;
    rotation: number;
    scale: Vector2;
    world: Engine

    components: Component[] = [];

    constructor(world: Engine, position: Vector2 = new Vector2(0, 0), rotation: number = 0, scale: Vector2 = new Vector2(1, 1)) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
        this.world = world;
    }

    update(delta: number) {
        this.components.forEach(component => {
            component.update(delta);
        });
    }

    destroy() {
        this.components.forEach(component => {
            // If components had a destroy method, we would call it here
            // component.destroy();
        });

        this.components = [];
    }
}