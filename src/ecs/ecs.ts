import { Allocator } from "./allocator";
import { Component } from "./component";
import { generatedComponents } from "@generated";

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

    componentMemory: ArrayBuffer[] = [];
    
    constructor() {

        for (let i = 0; i < generatedComponents.length; i++) {
            const componentType = generatedComponents[i];
            this.componentMemory.push(new ArrayBuffer(componentType.STRIDE * 100));
            this.componentMemory[componentType.IDENTIFIER] = new ArrayBuffer(componentType.STRIDE * 100);
            componentType.initialize({
                vf32: new Float32Array(this.componentMemory[componentType.IDENTIFIER]),
                vi32: new Int32Array(this.componentMemory[componentType.IDENTIFIER]),
                vu8: new Uint8Array(this.componentMemory[componentType.IDENTIFIER]),
            });
        }
    }
}