import { Entity } from "./entity";
import { InputHandler } from "./input";
import { startLifecycle } from "./lifecycle";
import { Renderer } from "./render/renderer";
import Renderer3D from "./render/renderer3d";
import Camera3D from "./render/camera3d";
import { Vector2 } from "./types/vector2";

export class Engine extends EventTarget{
    world: Entity[] = [];
    input: InputHandler;
    renderer: Renderer | Renderer3D;
    cameraPosition = new Vector2(0, 0);
    camera3D: Camera3D | null = null;

    canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        super();

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight;

        this.canvas = canvas;
        this.input = new InputHandler(canvas);
        // Use 3D renderer by default
        const r3 = new Renderer3D();
        this.renderer = r3;

        r3.initialize(canvas).then(async () => {
            // create camera
            this.camera3D = new Camera3D();
            // update initial projection/view
            const proj = this.camera3D.projection(canvas.width, canvas.height, -100, 100);
            const view = this.camera3D.view();
            r3.updateProjectionView(proj.multiply(view));

            // attempt to load any Texture components on existing entities
            if ((r3 as any).device) {
                const device = (r3 as any).device as GPUDevice;
                for (const e of this.world) {
                    for (const c of e.components) {
                        if ((c as any).load) {
                            try { await (c as any).load(device); } catch (_) { }
                        }
                    }
                }
            }

            this.dispatchEvent(new Event('ready'));
        });
        startLifecycle(this.update.bind(this));

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // update renderer depth texture and projection if 3D
            if (this.renderer instanceof Renderer3D) {
                (this.renderer as Renderer3D).createDepthTexture();
                if (this.camera3D) {
                    const proj = this.camera3D.projection(canvas.width, canvas.height, -100, 100);
                    const view = this.camera3D.view();
                    (this.renderer as Renderer3D).updateProjectionView(proj.multiply(view));
                }
            }
        });
    }

    update(delta: number) {
        this.world.forEach((entity) => {
            entity.update(delta);
        });
        
        console.log(this.world);
        
        if (this.renderer instanceof Renderer3D && this.camera3D) {
            // simple camera controls (WASD)
            const speed = 200 * delta;
            if (this.input.isKeyPressed('w')) this.camera3D.pan(0, -speed);
            if (this.input.isKeyPressed('s')) this.camera3D.pan(0, speed);
            if (this.input.isKeyPressed('a')) this.camera3D.pan(-speed, 0);
            if (this.input.isKeyPressed('d')) this.camera3D.pan(speed, 0);

            const proj = this.camera3D.projection(this.canvas.width, this.canvas.height, -100, 100);
            const view = this.camera3D.view();
            (this.renderer as Renderer3D).updateProjectionView(proj.multiply(view));
            (this.renderer as Renderer3D).renderEntities(this.world);
        } else {
            (this.renderer as Renderer).renderEntities(this.world, this.cameraPosition);
        }
    }

    createEntity(position: Vector2, rotation: number, scale: Vector2): Entity {
        const ent = new Entity(this, position, rotation, scale);
        this.world.push(ent);
        return ent;
    }

    public on = this.addEventListener;
}