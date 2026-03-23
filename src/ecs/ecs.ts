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
    private static readonly COMPONENT_CAPACITY = 10_000;

    componentMemory: ArrayBuffer[] = [];
    
    constructor() {

        for (let i = 0; i < generatedComponents.length; i++) {
            const componentType = generatedComponents[i];
            this.componentMemory[componentType.IDENTIFIER] = new ArrayBuffer(
                componentType.STRIDE * ECS.COMPONENT_CAPACITY,
            );
            componentType.initialize(this.componentMemory[componentType.IDENTIFIER], this.coldAllocator);
        }
    }
}