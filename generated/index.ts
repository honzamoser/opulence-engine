
        export class SparseSet {
    // Stores the actual values (Entity IDs) tightly packed
    // O(1) to get Value from Index (dense[i])
    dense: number[] = [];

    // Maps the Value to its Index in the dense array
    // O(1) to get Index from Value (sparse[val])
    // If your values are huge integers, use a Map<number, number> instead of an array.
    sparse: number[] = []; 

    add(value: number) {
        if (this.contains(value)) return;

        this.dense.push(value);
        this.sparse[value] = this.dense.length - 1;

        return this.sparse[value];
    }

    contains(value: number): boolean {
        // Checks if value exists and points to valid data
        const index = this.sparse[value];
        return index < this.dense.length && this.dense[index] === value;
    }

    /* O(1) Removal (The Swap-Pop trick) */
    remove(value: number) {
        if (!this.contains(value)) return;

        const indexToDelete = this.sparse[value];
        const lastElement = this.dense[this.dense.length - 1];

        // 1. Overwrite the element to delete with the last element
        this.dense[indexToDelete] = lastElement;

        // 2. Update the sparse map for the swapped element
        this.sparse[lastElement] = indexToDelete;

        // 3. Remove the last element
        this.dense.pop();
        
        // Optional: clear the sparse slot (not strictly necessary but cleaner)
        this.sparse[value] = undefined; 
    }
    
    getIndex(value: number) {
        return this.sparse[value];
    }
    
    getValue(index: number) {
        return this.dense[index];
    }
}

import { CameraComponent } from "./camera";
import { MeshComponent } from "./mesh";
import { RigidbodyComponent } from "./rigidbody";
import { TransformComponent } from "./transform";

    export const generatedComponents = [
        CameraComponent,
MeshComponent,
RigidbodyComponent,
TransformComponent
    ];

    export {
        CameraComponent,
MeshComponent,
RigidbodyComponent,
TransformComponent
}

export type GeneratedComponent = CameraComponent | MeshComponent | RigidbodyComponent | TransformComponent;

