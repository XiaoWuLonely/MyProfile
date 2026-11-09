import type { gsap as animationEngine } from 'gsap';
type Timeline = ReturnType<typeof animationEngine.timeline>;

interface Scene {
  id: string;
  start: number;
  read: number;
  leave: number;
  end: number;
}

export function choreographProject(
  timeline: Timeline,
  panel: HTMLElement,
  scene: Scene,
  desktop: boolean,
) {
  const journal = panel.querySelector('.journal-stage');
  if (!journal) return false;
  const entry = scene.read - scene.start;
  const exit = scene.end - scene.leave;
  const leaves = journal.querySelectorAll('[data-journal-leaf]');
  timeline.fromTo(
    journal.querySelector('.journal-spread'),
    { y: desktop ? 45 : 20, rotationX: desktop ? 12 : 4, rotationZ: -7 },
    {
      y: 0,
      rotationX: 0,
      rotationZ: -2,
      duration: entry * 0.9,
      ease: 'power2.inOut',
    },
    scene.start,
  );
  timeline.fromTo(
    leaves,
    { rotationY: -86, scaleX: 0.12, opacity: 0 },
    {
      rotationY: 0,
      scaleX: 1,
      opacity: 1,
      duration: entry * 0.62,
      stagger: entry * 0.11,
      ease: 'power2.inOut',
    },
    scene.start,
  );
  timeline.fromTo(
    journal.querySelectorAll('[data-journal-ink]'),
    { scaleX: 0 },
    { scaleX: 1, duration: entry * 0.28, stagger: entry * 0.035, ease: 'none' },
    scene.start + entry * 0.4,
  );
  timeline.fromTo(
    panel.querySelector('.scene-copy'),
    { clipPath: 'inset(0 0 100% 0)', y: 12 },
    {
      clipPath: 'inset(0 0 0% 0)',
      y: 0,
      duration: entry * 0.3,
      ease: 'power2.out',
    },
    scene.start + entry * 0.65,
  );
  timeline.to(
    leaves,
    {
      rotationY: (i: number) => (i === 3 ? -40 : 35),
      x: (i: number) => (i === 3 ? 150 : -25),
      y: (i: number) => (i === 3 ? -35 : 0),
      opacity: 0,
      duration: exit,
      stagger: 0,
      ease: 'power2.inOut',
    },
    scene.leave,
  );
  timeline.to(
    panel.querySelector('.scene-copy'),
    { opacity: 0, y: -8, duration: exit * 0.4 },
    scene.leave,
  );
  return true;
}
