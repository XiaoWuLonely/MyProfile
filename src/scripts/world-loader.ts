import { worldState } from './story';
export function initializeWorld() {
  const container = document.querySelector<HTMLElement>('#world-canvas');
  if (!container) return () => {};
  const desktop = matchMedia('(min-width:1024px) and (pointer:fine)'),
    reduce = matchMedia('(prefers-reduced-motion:reduce)');
  let generation = 0,
    disposed = false;
  let unmount: (() => void) | undefined;
  const update = async () => {
    const current = ++generation;
    unmount?.();
    unmount = undefined;
    if (reduce.matches || new URLSearchParams(location.search).has('reading')) {
      container.dataset.world = 'reading';
      return;
    }
    if (!desktop.matches) {
      container.dataset.world = '2d';
      return;
    }
    container.dataset.world = 'loading';
    try {
      const { mountWorld } = await import('./paper-world');
      if (!disposed && generation === current)
        unmount = mountWorld(container, worldState);
    } catch (error) {
      if (!disposed && generation === current)
        container.dataset.world = 'fallback';
      if (import.meta.env.DEV)
        console.warn('Paper world uses the 2.5D scene.', error);
    }
  };
  desktop.addEventListener('change', update);
  reduce.addEventListener('change', update);
  const idle = setTimeout(() => void update(), 80);
  const visibility = () =>
    document.documentElement.toggleAttribute(
      'data-world-paused',
      document.hidden,
    );
  document.addEventListener('visibilitychange', visibility);
  return () => {
    disposed = true;
    generation++;
    clearTimeout(idle);
    unmount?.();
    desktop.removeEventListener('change', update);
    reduce.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', visibility);
  };
}
