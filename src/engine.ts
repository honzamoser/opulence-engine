import { Entity } from "./entity";
import { InputHandler } from "./input";
import { startLifecycle } from "./lifecycle";
import { Renderer } from "./render/renderer";
import { Vector2 } from "./types/vector2";

export class Engine extends EventTarget{
    world: Entity[] = [];
    input: InputHandler;
    renderer: Renderer;
    cameraPosition = new Vector2(0, 0);

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        super();

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight;

        this.canvas = canvas;
        this.input = new InputHandler(canvas);
        this.renderer = new Renderer();

        this.renderer.initializeWebGpu(canvas).then(() => {
            this.dispatchEvent(new Event('ready'));
        })
        startLifecycle(this.update.bind(this));

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    update(delta: number) {
        this.world.forEach((entity) => {
            entity.update(delta);
        });
        
        console.log(this.world);
        
        this.renderer.renderEntities(this.world, this.cameraPosition);
    }

    createEntity(position: Vector2, rotation: number, scale: Vector2): Entity {
        const ent = new Entity(this, position, rotation, scale);
        this.world.push(ent);
        return ent;
    }

    public on = this.addEventListener;
}