export function initializeScene() {
  const container = document.querySelector<HTMLElement>('#paper-scene');
  if (!container) return () => {};
  const desktop = matchMedia('(min-width: 1024px) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let generation = 0;
  let disposed = false;
  let unmount: (() => void) | undefined;
  const update = async () => {
    const current = ++generation;
    unmount?.();
    unmount = undefined;
    if (reduce.matches || !desktop.matches) {
      container.dataset.scene = reduce.matches ? 'reduced' : '2d';
      return;
    }
    container.dataset.scene = 'loading';
    try {
      const { mountPaperScene } = await import('./paper-scene');
      if (disposed || current !== generation) return;
      unmount = mountPaperScene(container);
    } catch (error) {
      if (disposed || current !== generation) return;
      container.dataset.scene = 'fallback';
      if (import.meta.env.DEV)
        console.warn(
          'Paper scene unavailable; keeping the static illustration.',
          error,
        );
    }
  };
  desktop.addEventListener('change', update);
  reduce.addEventListener('change', update);
  // Let the browser paint the readable document before initializing WebGL.
  const start = window.requestIdleCallback
    ? window.requestIdleCallback(() => void update(), { timeout: 1600 })
    : window.setTimeout(() => void update(), 200);
  return () => {
    disposed = true;
    generation++;
    unmount?.();
    desktop.removeEventListener('change', update);
    reduce.removeEventListener('change', update);
    if (window.cancelIdleCallback) window.cancelIdleCallback(start);
    else clearTimeout(start);
  };
}
