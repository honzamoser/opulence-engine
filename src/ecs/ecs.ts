import { generatedComponents } from "virtual:ecs";
import { components as ecsComponents } from "virtual:ecs";
import { Allocator } from "./allocator";
import { Component } from "./component";
import CameraComponent from "./components/camera.component";
import { ClassConstructor } from "./oldecs";

type ComponentStructure = {
    name: string,
    path: string,
    id: number,
    stride: number,
    fields: FieldSchema[]
    cls: any;
}

type FieldSchema = {
    name: string;
    type: string;
    offset: number;
    count: number;
    defaultValue?: any;
    pointer: boolean;
}

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
            this.componentAccessors[componentType.id] = new (generatedComponents.find(c => c.parent === componentType.cls)! as any)({
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
            (componentType.cls as Component).id = i;
        }
    }


    getAccesor(id: number, c: ClassConstructor<any>): any {
        return this.componentAccessors[c.id].to(id);
    }

    pushComponent(componentType: Component, args: any): number {
        const componentTypeId = componentType.id;
        const componentStructure = ecsComponents[componentTypeId];
        const accessor: typeof generatedComponents[number] = this.componentAccessors[componentTypeId];
        
        componentStructure.fields.forEach((field, index) => {
            if(args[field.name]) {
                if(field.type == "f32") {
                    accessor.
                }
            }
        })
        
        return this.componentCursors[componentTypeId];
        this.componentCursors[componentTypeId]++;

    }
}