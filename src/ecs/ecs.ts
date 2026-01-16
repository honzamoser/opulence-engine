import { generatedComponents } from "virtual:ecs";
import { components as ecsComponents } from "virtual:ecs";
import { Allocator } from "./allocator";
import { Component } from "./component";
import CameraComponent from "./components/camera.component";
import { ClassConstructor } from "./oldecs";

export class ECS {
    coldAllocator = new Allocator(2 ** 12);

    componentRegistry: Component[] = []
    componentMemory: ArrayBuffer[] = [];
    componentAccessors: InstanceType<(typeof generatedComponents)[number]>[] = [];
    componentCursors: number[] = [];

    constructor() {

        for (let i = 0; i < ecsComponents.length; i++) {
            const componentType = ecsComponents[i];
            this.componentMemory.push(new ArrayBuffer(componentType.stride * 100));
            this.componentCursors[componentType.id] = 0;
            this.componentAccessors[componentType.id] = new (generatedComponents.find(c => c.parent === componentType.name)!)({
                f32: new Float32Array(this.componentMemory[i]),
                i32: new Int32Array(this.componentMemory[i]),
                u32: new Uint32Array(this.componentMemory[i]),
                u8: new Uint8Array(this.componentMemory[i]),
            }, {
                f32: new Float32Array(this.coldAllocator.heap),
                i32: new Int32Array(this.coldAllocator.heap),
                u32: new Uint32Array(this.coldAllocator.heap),
                u8: new Uint8Array(this.coldAllocator.heap),
            });

            
        }

        setTimeout(() => {
            console.log(CameraComponent.id);
        }, 1000);

        
    }

    pushComponent(componentType: Component, args: any): number {
        
        console.log(this.componentRegistry)
        console.log(CameraComponent.id)

    }
}