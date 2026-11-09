import type { Timeline, Scene } from './types';
export function choreographAirport(
  timeline: Timeline,
  panel: HTMLElement,
  scene: Scene,
) {
  const airport = panel.querySelector('.airport-stage');
  if (!airport) return false;
  const entry = scene.read - scene.start,
    exit = scene.end - scene.leave;
  const world = document.querySelector('.world-backdrop');
  timeline.fromTo(
    world,
    { '--world-haze': 1 },
    { '--world-haze': 0, duration: entry * 0.6, ease: 'power2.inOut' },
    scene.start,
  );
  timeline.to(
    world,
    { '--world-haze': 1, duration: exit, ease: 'power2.inOut' },
    scene.leave,
  );
  timeline.fromTo(
    airport.querySelector('.airport-model'),
    { scale: 0.76, rotationZ: -7, y: 35 },
    {
      scale: 1,
      rotationZ: 0,
      y: 0,
      duration: entry * 0.75,
      ease: 'power2.out',
    },
    scene.start,
  );
  timeline.fromTo(
    airport.querySelectorAll('[data-terminal-fold]'),
    { scaleY: 0.03, y: 30, opacity: 0 },
    {
      scaleY: 1,
      y: 0,
      opacity: 1,
      duration: entry * 0.55,
      stagger: entry * 0.1,
      ease: 'power2.inOut',
    },
    scene.start + entry * 0.08,
  );
  timeline.fromTo(
    airport.querySelector('[data-airport-plane]'),
    { x: -90, y: 35, rotation: -15, opacity: 0 },
    {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      duration: entry * 0.65,
      ease: 'power2.inOut',
    },
    scene.start + entry * 0.07,
  );
  airport
    .querySelectorAll<SVGPathElement>('[data-airline],[data-airport-trend]')
    .forEach((path, i) => {
      const length = path.getTotalLength();
      timeline.fromTo(
        path,
        { strokeDasharray: length, strokeDashoffset: length },
        { strokeDashoffset: 0, duration: entry * 0.36, ease: 'none' },
        scene.start + entry * (0.53 + i * 0.08),
      );
    });
  timeline.fromTo(
    airport.querySelectorAll('[data-passenger]'),
    {
      scale: 0,
      opacity: 0,
      transformOrigin: 'center',
      transformBox: 'fill-box',
    },
    {
      scale: 1,
      opacity: 1,
      duration: entry * 0.12,
      stagger: entry * 0.018,
      ease: 'none',
    },
    scene.start + entry * 0.6,
  );
  timeline.fromTo(
    airport.querySelector('.airport-insight'),
    { scaleX: 0, transformOrigin: 'left' },
    { scaleX: 1, duration: entry * 0.3, ease: 'power2.out' },
    scene.start + entry * 0.65,
  );
  timeline.fromTo(
    panel.querySelector('.scene-copy'),
    { clipPath: 'inset(0 0 0 100%)' },
    { clipPath: 'inset(0 0 0 0%)', duration: entry * 0.25 },
    scene.start + entry * 0.7,
  );
  timeline.set(
    panel.querySelector('.scene-copy'),
    { clipPath: 'none' },
    scene.read,
  );
  timeline.to(
    airport.querySelectorAll('[data-terminal-fold]'),
    {
      scaleY: 0.05,
      y: 30,
      opacity: 0,
      duration: exit * 0.8,
      stagger: 0,
      ease: 'power2.inOut',
    },
    scene.leave,
  );
  timeline.to(
    airport.querySelector('[data-airport-plane]'),
    { x: 100, y: -80, opacity: 0, duration: exit },
    scene.leave,
  );
  timeline.to(
    airport.querySelector('.airport-insight'),
    { scaleX: 0, duration: exit * 0.6 },
    scene.leave,
  );
  timeline.to(
    panel.querySelector('.scene-copy'),
    { opacity: 0, duration: exit * 0.4 },
    scene.leave,
  );
  return true;
}
