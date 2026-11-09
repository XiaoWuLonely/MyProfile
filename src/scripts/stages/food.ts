import type { Timeline, Scene } from './types';
export function choreographFood(
  timeline: Timeline,
  panel: HTMLElement,
  scene: Scene,
) {
  const food = panel.querySelector('.food-stage');
  if (!food) return false;
  const entry = scene.read - scene.start,
    exit = scene.end - scene.leave;
  timeline.fromTo(
    food.querySelector('.food-menu'),
    { rotationZ: -14, y: 30 },
    { rotationZ: -6, y: 0, duration: entry * 0.65, ease: 'power2.out' },
    scene.start,
  );
  timeline.fromTo(
    food.querySelector('.food-menu-cover'),
    { rotationY: 0 },
    { rotationY: -180, duration: entry * 0.55, ease: 'power2.inOut' },
    scene.start,
  );
  timeline.fromTo(
    food.querySelector('.food-plate'),
    { rotationX: 80, scale: 0.2, opacity: 0 },
    {
      rotationX: 58,
      scale: 1,
      opacity: 1,
      duration: entry * 0.5,
      ease: 'power2.out',
    },
    scene.start + entry * 0.15,
  );
  timeline.fromTo(
    food.querySelectorAll('[data-meal-layer]'),
    {
      y: (i: number) => -105 - i * 20,
      rotation: (i: number) => (i % 2 ? 18 : -14),
      opacity: 0,
    },
    {
      y: 0,
      rotation: 0,
      opacity: 1,
      duration: entry * 0.3,
      stagger: entry * 0.07,
      ease: 'power2.inOut',
    },
    scene.start + entry * 0.25,
  );
  timeline.fromTo(
    food.querySelector('.fries-sleeve'),
    { scaleY: 0.05, transformOrigin: 'center bottom' },
    { scaleY: 1, duration: entry * 0.25, ease: 'power2.out' },
    scene.start + entry * 0.45,
  );
  timeline.fromTo(
    food.querySelectorAll('[data-fries-stick]'),
    { y: -45, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: entry * 0.2,
      stagger: entry * 0.04,
      ease: 'power2.out',
    },
    scene.start + entry * 0.45,
  );
  timeline.fromTo(
    food.querySelector('[data-order-receipt]'),
    { scaleY: 0 },
    { scaleY: 1, duration: entry * 0.2, ease: 'power2.out' },
    scene.start + entry * 0.75,
  );
  timeline.fromTo(
    food.querySelectorAll('[data-receipt-ink]'),
    { scaleX: 0 },
    { scaleX: 1, duration: entry * 0.08, stagger: entry * 0.02, ease: 'none' },
    scene.start + entry * 0.86,
  );
  timeline.fromTo(
    panel.querySelector('.scene-copy'),
    { clipPath: 'inset(0 0 100% 0)' },
    { clipPath: 'inset(0 0 0% 0)', duration: entry * 0.25 },
    scene.start + entry * 0.72,
  );
  timeline.to(
    food.querySelectorAll('[data-meal-layer]'),
    {
      y: (i: number) => -25 * (5 - i),
      rotation: (i: number) => (i % 2 ? 15 : -18),
      opacity: 0,
      duration: exit * 0.8,
      stagger: 0,
      ease: 'power2.in',
    },
    scene.leave,
  );
  timeline.to(
    food.querySelector('.food-menu-cover'),
    { rotationY: 0, duration: exit * 0.75, ease: 'power2.inOut' },
    scene.leave,
  );
  timeline.to(
    food.querySelector('.food-menu'),
    { opacity: 0, duration: exit * 0.7 },
    scene.leave + exit * 0.3,
  );
  timeline.to(
    food.querySelector('.paper-fries'),
    { y: -30, opacity: 0, duration: exit * 0.8 },
    scene.leave,
  );
  timeline.to(
    food.querySelector('[data-order-receipt]'),
    { scaleY: 1.8, y: 30, opacity: 0, duration: exit, ease: 'power2.inOut' },
    scene.leave,
  );
  timeline.to(
    panel.querySelector('.scene-copy'),
    { opacity: 0, duration: exit * 0.4 },
    scene.leave,
  );
  return true;
}
