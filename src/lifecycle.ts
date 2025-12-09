export function startLifecycle(fn: (delta: number) => any) {
    let l = performance.now();
    requestAnimationFrame(function loop(timestamp) {
        fn(timestamp - l);
        l = timestamp;
        requestAnimationFrame(loop);
    });
}