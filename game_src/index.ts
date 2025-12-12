import { Texture } from "../src/components/texture";
import { Engine } from "../src/engine"
import { AnimationClip, Animator } from "../src/render/animation";
import { Vector2 } from "../src/types/vector2";
import { CharacterComponent } from "./components/character";
import { MapMaker } from "./components/map_maker";
import { loadGLTF } from "../src/assets/gltfLoader";
import Model3D from "../src/components/model3d";
import { load } from "@loaders.gl/core";
import {GLTFLoader} from '@loaders.gl/gltf';

const canvas = document.getElementById("main") as HTMLCanvasElement
console.log(canvas);

const engine = new Engine(canvas);


engine.on('ready', async () => {

    try {
        const modelMesh = await load("resources/Cube.gltf", GLTFLoader, {})

        

        const modelEntity = engine.createEntity(new Vector2(500, 300), 0, new Vector2(64, 64));
        const modelComp = new Model3D(modelEntity, modelMesh as any);
        modelEntity.components.push(modelComp);

        // upload mesh buffers to GPU
        await modelComp.uploadToDevice((engine.renderer as any).device!);

        // if glTF provided a textureUri, create Texture component for it
        if (modelMesh.textureUrl) {
            const tex = new Texture(modelEntity, modelMesh.textureUrl);
            await tex.load((engine.renderer as any).device!);
            modelEntity.components.push(tex);
        }
    } catch (err) {
        console.warn('Failed to load GLTF model:', err);
    }

})


