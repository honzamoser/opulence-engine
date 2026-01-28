export function startLifecycle(fn: (delta: number) => any) {
  let lastTime = performance.now();
  let frameId: number;

  let step = 1;

  function loop(currentTime: number) {
    frameId = requestAnimationFrame(loop);

    // if(step == 0) return;

    const delta = currentTime - lastTime;
    lastTime = currentTime;

    if (delta > (1 / 60) * 1000 + 1) {
      console.warn(`Skipped frame: ${delta}`);
    }

    fn(1/delta);


    step--;
  }

  window.stepFrame = () => {
    step++;
  }

  frameId = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frameId);
  };
}
