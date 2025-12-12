import { Entity } from "../entity";

export abstract class Component {
    enabled: boolean;
    parent: Entity;

    constructor(parent: Entity, enabled: boolean = true) {
        this.enabled = enabled;
        this.parent = parent;

        this.parent.components.push(this);
        if(this.start) this.start();
    }

    abstract start?(): void;
    abstract update?(delta: number): void;
}