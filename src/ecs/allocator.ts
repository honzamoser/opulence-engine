import { ComponentBufferViews } from "./ecs";

// TODO: Actually implement a bucketed heap allocator
export class Allocator {
  heap: ArrayBuffer;

  cursor: number = 0;
  buckets: number[][] = [];

  views: ComponentBufferViews;

  constructor(initPage: number) {
    this.heap = new ArrayBuffer(initPage);
    this.views = {
      Uint8View: new Uint8Array(this.heap),
      Float32View: new Float32Array(this.heap),
      Int32View: new Int32Array(this.heap),
    };
  }

  resize() {
    const newHeap = new ArrayBuffer(this.heap.byteLength * 2);
    new Uint8Array(newHeap).set(new Uint8Array(this.heap));
    this.heap = newHeap;
    this.views = {
      Uint8View: new Uint8Array(this.heap),
      Float32View: new Float32Array(this.heap),
      Int32View: new Int32Array(this.heap),
    };
  }

  alloc(size: number) {
    if (this.cursor + size > this.heap.byteLength) {
      this.resize();
    }

    const ptr = this.cursor;
    this.cursor += size;
    return ptr;
  }

  resize_alloc(ptr: number, size: number, newSize: number) {
    if (this.cursor + newSize > this.heap.byteLength) {
      this.resize();
    }

    // Find a place for the new allocation
    const newPtr = this.cursor;
    this.cursor += newSize;

    // Copy the old data to the new location
    this.views.Uint8View.set(this.views.Uint8View.subarray(ptr, ptr + size), newPtr);
    
    // Free the old allocation
    this.free(ptr, size);
    return newPtr;
  }

  get_mem_vu8(ptr: number, size: number) {
    return this.views.Uint8View.subarray(ptr, ptr + size);
  }

  get_mem_vf32(ptr: number, size: number) {
    return this.views.Float32View.subarray(ptr / 4, ptr / 4 + size / 4);
  }

  get_mem_vi32(ptr: number, size: number) {
    return this.views.Int32View.subarray(ptr / 4, ptr / 4 + size / 4);
  }

  free(ptr: number, size: number) {
    const bucket = this.buckets[size];

    if (bucket) {
      bucket.push(ptr);
    } else {
      this.buckets[size] = [ptr];
    }

    console.log("Free buckets: ", this.buckets);
  }

  defrag() {
    // todo
  }
}
