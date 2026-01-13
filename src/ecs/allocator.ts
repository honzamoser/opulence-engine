export class Allocator {
  heap: Uint8Array;

  cursor: number = 0;
  buckets: number[][] = [];

  constructor(initPage: number) {
    this.heap = new Uint8Array(initPage);
  }

  resize() {
    const newHeap = new Uint8Array(this.heap.byteLength * 2);
    new Uint8Array(newHeap).set(this.heap);
    this.heap = newHeap;
  }

  alloc(size: number) {
    if (this.cursor + size > this.heap.byteLength) {
      this.resize();
    }

    const ptr = this.cursor;
    this.cursor += size;
    return this.heap.subarray(ptr, ptr + size);
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
