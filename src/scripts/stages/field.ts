import type { Timeline, Scene } from './types';
export function choreographField(
  timeline: Timeline,
  panel: HTMLElement,
  scene: Scene,
  desktop: boolean,
) {
  const field = panel.querySelector('.field-stage');
  if (!field) return false;
  const entry = scene.read - scene.start,
    exit = scene.end - scene.leave;
  timeline.fromTo(
    field.querySelector('.field-terrain'),
    { rotationX: 75, rotationZ: -28, y: 45 },
    {
      rotationX: 53,
      rotationZ: -16,
      y: 0,
      duration: entry * 0.9,
      ease: 'power2.out',
    },
    scene.start,
  );
  timeline.fromTo(
    field.querySelectorAll('[data-terrace]'),
    { scaleY: 0.08, rotationX: -75, y: 40, opacity: 0 },
    {
      scaleY: 1,
      rotationX: 0,
      y: 0,
      opacity: 1,
      duration: entry * 0.48,
      stagger: entry * 0.11,
      ease: 'power2.inOut',
    },
    scene.start,
  );
  timeline.fromTo(
    field.querySelectorAll('[data-ridge]'),
    { scaleY: 0 },
    { scaleY: 1, duration: entry * 0.45, stagger: entry * 0.007, ease: 'none' },
    scene.start + entry * 0.25,
  );
  timeline.fromTo(
    field.querySelectorAll('[data-crop]'),
    { scaleY: 0, y: 18 },
    {
      scaleY: 1,
      y: 0,
      duration: entry * 0.4,
      stagger: entry * 0.08,
      ease: 'back.out(1.2)',
    },
    scene.start + entry * 0.28,
  );
  timeline.fromTo(
    field.querySelector('[data-market-tag]'),
    { y: desktop ? -100 : -45, rotationY: 45, opacity: 0 },
    {
      y: 0,
      rotationY: 0,
      opacity: 1,
      duration: entry * 0.45,
      ease: 'power2.out',
    },
    scene.start + entry * 0.4,
  );
  timeline.fromTo(
    field.querySelector('[data-field-parcel]'),
    { x: 90, y: 25, scale: 0.5, opacity: 0 },
    {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      duration: entry * 0.4,
      ease: 'power2.out',
    },
    scene.start + entry * 0.5,
  );
  const path = field.querySelector<SVGPathElement>('[data-field-line]')!;
  const length = path.getTotalLength();
  timeline.fromTo(
    path,
    { strokeDasharray: length, strokeDashoffset: length },
    { strokeDashoffset: 0, duration: entry * 0.65, ease: 'none' },
    scene.start + entry * 0.2,
  );
  timeline.fromTo(
    panel.querySelector('.scene-copy'),
    { y: 18, opacity: 0 },
    { y: 0, opacity: 1, duration: entry * 0.25 },
    scene.start + entry * 0.7,
  );
  timeline.to(
    field.querySelectorAll('[data-crop]'),
    { scaleY: 0.08, opacity: 0, duration: exit * 0.7, stagger: exit * 0.08 },
    scene.leave,
  );
  timeline.to(
    field.querySelector('.field-terrain'),
    {
      rotationX: 75,
      scale: 0.85,
      opacity: 0,
      duration: exit,
      ease: 'power2.inOut',
    },
    scene.leave,
  );
  timeline.to(
    field.querySelector('[data-market-tag]'),
    { y: -45, opacity: 0, duration: exit * 0.7 },
    scene.leave,
  );
  timeline.to(
    field.querySelector('[data-field-parcel]'),
    {
      x: 80,
      y: -65,
      rotationZ: -16,
      opacity: 0,
      duration: exit,
      ease: 'power2.inOut',
    },
    scene.leave,
  );
  timeline.to(
    panel.querySelector('.scene-copy'),
    { opacity: 0, duration: exit * 0.35 },
    scene.leave,
  );
  return true;
}
