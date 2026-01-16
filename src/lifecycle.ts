export function startLifecycle(fn: (delta: number) => any) {
  let lastTime = performance.now();
  let frameId: number;

  function loop(currentTime: number) {
    frameId = requestAnimationFrame(loop);

    const delta = currentTime - lastTime;
    lastTime = currentTime;

    if (delta > (1 / 60) * 1000 + 1) {
      console.warn(`Skipped frame: ${delta}`);
    }

    fn(1/delta);
    
  }

  frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frameId);
  };
}
