import type { Timeline, Scene } from './stages/types';
import { choreographField } from './stages/field';
import { choreographAirport } from './stages/airport';

export function choreographProject(
  timeline: Timeline,
  panel: HTMLElement,
  scene: Scene,
  desktop: boolean,
) {
  if (choreographField(timeline, panel, scene, desktop)) return true;
  if (choreographAirport(timeline, panel, scene)) return true;
  const knowledge = panel.querySelector('.knowledge-stage');
  if (knowledge) {
    const entry = scene.read - scene.start,
      exit = scene.end - scene.leave;
    const network = knowledge.querySelector('.knowledge-network');
    const nodes = knowledge.querySelectorAll('[data-knowledge-node]');
    timeline.fromTo(
      network,
      { scale: 0.68, rotationZ: -7 },
      {
        scale: desktop ? 1.28 : 1.08,
        rotationZ: 2,
        duration: entry * 0.55,
        ease: 'power2.inOut',
      },
      scene.start,
    );
    timeline.to(
      network,
      { scale: 1, rotationZ: 0, duration: entry * 0.45, ease: 'power2.out' },
      scene.start + entry * 0.55,
    );
    timeline.fromTo(
      nodes,
      {
        x: (i: number) => (i % 2 ? 1 : -1) * (desktop ? 180 : 65),
        y: (i: number) => (i < 2 ? -65 : 75),
        rotationY: (i: number) => (i % 2 ? -55 : 55),
        opacity: 0,
      },
      {
        x: 0,
        y: 0,
        rotationY: 0,
        opacity: 1,
        duration: entry * 0.57,
        stagger: entry * 0.09,
        ease: 'power3.inOut',
      },
      scene.start,
    );
    knowledge
      .querySelectorAll<SVGPathElement>('[data-network-line]')
      .forEach((path, i) => {
        const length = path.getTotalLength();
        timeline.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          { strokeDashoffset: 0, duration: entry * 0.5, ease: 'none' },
          scene.start + entry * (0.28 + i * 0.05),
        );
      });
    timeline.fromTo(
      knowledge.querySelector('[data-knowledge-core]'),
      { scale: 0, rotation: -60 },
      { scale: 1, rotation: 0, duration: entry * 0.4, ease: 'back.out(1.2)' },
      scene.start + entry * 0.25,
    );
    timeline.fromTo(
      knowledge.querySelector('.knowledge-answer'),
      { clipPath: 'inset(0 100% 0 0)' },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: entry * 0.3,
        ease: 'power2.out',
      },
      scene.start + entry * 0.6,
    );
    timeline.fromTo(
      knowledge.querySelectorAll('[data-answer-word]'),
      { opacity: 0, y: 5 },
      {
        opacity: 1,
        y: 0,
        duration: entry * 0.12,
        stagger: entry * 0.055,
        ease: 'none',
      },
      scene.start + entry * 0.71,
    );
    timeline.fromTo(
      panel.querySelector('.scene-copy'),
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: entry * 0.3 },
      scene.start + entry * 0.66,
    );
    timeline.to(
      nodes,
      {
        scale: 0.72,
        y: 55,
        opacity: 0,
        duration: exit * 0.7,
        stagger: exit * 0.05,
        ease: 'power2.in',
      },
      scene.leave,
    );
    timeline.to(
      knowledge.querySelector('.knowledge-answer'),
      { y: 25, opacity: 0, duration: exit * 0.6 },
      scene.leave,
    );
    timeline.to(
      knowledge.querySelector('[data-knowledge-core]'),
      { scale: 0.3, opacity: 0, duration: exit * 0.8 },
      scene.leave,
    );
    timeline.to(
      panel.querySelector('.scene-copy'),
      { opacity: 0, duration: exit * 0.35 },
      scene.leave,
    );
    return true;
  }
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
