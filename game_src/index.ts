import { Texture } from "../src/components/texture";
import { Engine } from "../src/engine"
import { AnimationClip, Animator } from "../src/render/animation";
import { Vector2 } from "../src/types/vector2";
import { CharacterComponent } from "./components/character";
import { MapMaker } from "./components/map_maker";

const canvas = document.getElementById("main") as HTMLCanvasElement
console.log(canvas);

const engine = new Engine(canvas);


engine.on('ready', async () => {
    const ent = engine.createEntity(new Vector2(320, 240), 0, new Vector2(100, 100));
    const idle_texture = new Texture(ent, "resources/IDLE.png");
    await idle_texture.load(engine.renderer.device!);

    const walk_texture = new Texture(ent, "resources/RUN.png");
    await walk_texture.load(engine.renderer.device!);

    console.log(walk_texture, walk_texture.view, walk_texture.sampler, walk_texture.texture);
    

    let character = new CharacterComponent(ent, engine);

    // 10 frames
    const idleFrames = [
        { x: 0, y: 0, width: 96, height: 96 },
        { x: 96, y: 0, width: 96, height: 96 },
        { x: 192, y: 0, width: 96, height: 96 },
        { x: 288, y: 0, width: 96, height: 96 },
        { x: 384, y: 0, width: 96, height: 96 },
        { x: 480, y: 0, width: 96, height: 96 },
        { x: 576, y: 0, width: 96, height: 96 },
        { x: 672, y: 0, width: 96, height: 96 },
        { x: 768, y: 0, width: 96, height: 96 },
        { x: 864, y: 0, width: 96, height: 96 },
    ]

    const walkFrames = [
        { x: 0, y: 0, width: 96, height: 96 },
        { x: 96, y: 0, width: 96, height: 96 },
        { x: 192, y: 0, width: 96, height: 96 },
        { x: 288, y: 0, width: 96, height: 96 },
        { x: 384, y: 0, width: 96, height: 96 },
        { x: 480, y: 0, width: 96, height: 96 },
        { x: 576, y: 0, width: 96, height: 96 },
        { x: 672, y: 0, width: 96, height: 96 },
        { x: 768, y: 0, width: 96, height: 96 },
        { x: 864, y: 0, width: 96, height: 96 },
        { x: 960, y: 0, width: 96, height: 96 },
        { x: 1056, y: 0, width: 96, height: 96 },
        { x: 1152, y: 0, width: 96, height: 96 },
        { x: 1248, y: 0, width: 96, height: 96 },
        { x: 1344, y: 0, width: 96, height: 96 },
        { x: 1440, y: 0, width: 96, height: 96 },
    ]

    const idleClip = new AnimationClip("idle", idleFrames, 100); // 100ms per frame
    const walkClip = new AnimationClip("walk", walkFrames, 80); // 80ms per frame
    let animator = new Animator(ent);
    animator.addClip(walkClip);
    animator.addClip(idleClip);
    animator.play("idle");

    character.event.addEventListener('move', () => {
        idle_texture.enabled = false;
        walk_texture.enabled = true;

        console.log('move');

        if (character.moveDirection === "right") {
            walk_texture.flip_x = true;
        } else {
            walk_texture.flip_x = false;
        }
        

        animator.play("walk");
    })

    character.event.addEventListener('stopmove', () => {
        idle_texture.enabled = true;
        walk_texture.enabled = false;

        console.log('stopmove');
        

        animator.play("idle");
    })




    // ent.components.push(characterComponent);

    // ent.components.push(new MapMaker(ent));

})


