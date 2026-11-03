import { gsap } from 'gsap';
interface Scene {
  id: string;
  start: number;
  read: number;
  leave: number;
  end: number;
}
export function stageProps(
  timeline: gsap.core.Timeline,
  panel: HTMLElement,
  scene: Scene,
) {
  const entry = scene.read - scene.start,
    exit = scene.end - scene.leave;
  const folds = panel.querySelectorAll('[data-fold]');
  if (folds.length && entry > 0) {
    timeline.fromTo(
      folds,
      {
        scaleY: 0.06,
        y: 30,
        rotation: -12,
        opacity: 0,
        transformOrigin: '50% 100%',
      },
      {
        scaleY: 1,
        y: 0,
        rotation: 0,
        opacity: 1,
        duration: entry * 0.6,
        stagger: entry * 0.08,
        ease: 'back.out(1.15)',
      },
      scene.start + entry * 0.12,
    );
    if (exit > 0)
      timeline.to(
        folds,
        {
          scaleY: 0.05,
          y: 30,
          opacity: 0,
          duration: exit * 0.6,
          stagger: 0,
          ease: 'power2.in',
        },
        scene.leave + exit * 0.4,
      );
  }
  panel.querySelectorAll<SVGPathElement>('[data-draw]').forEach((path) => {
    const length = path.getTotalLength();
    timeline.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      {
        strokeDashoffset: 0,
        duration: Math.max(0.5, entry * 0.7),
        ease: 'none',
      },
      scene.start + entry * 0.25,
    );
  });
  const bookmark = panel.querySelector('[data-bookmark]');
  const plane = panel.querySelector('[data-plane]');
  if (plane) {
    timeline.fromTo(
      plane,
      { x: -95, y: 35, rotation: -12, opacity: 0 },
      {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        duration: entry * 0.75,
        ease: 'power2.out',
      },
      scene.start + entry * 0.2,
    );
    if (exit > 0)
      timeline.to(
        plane,
        { x: 65, y: -25, opacity: 0, duration: exit * 0.7 },
        scene.leave + exit * 0.3,
      );
  }
  const cards = panel.querySelectorAll('[data-card]');
  if (cards.length)
    timeline.fromTo(
      cards,
      { x: (i) => (i % 2 ? 60 : -60) },
      { x: 0, duration: entry * 0.7, ease: 'power2.out' },
      scene.start + entry * 0.15,
    );
  if (bookmark && exit > 0)
    timeline.to(
      bookmark,
      {
        scaleY: 2.5,
        transformOrigin: '50% 0',
        duration: exit * 0.8,
        ease: 'power2.inOut',
      },
      scene.leave,
    );
}

export function connectStages(timeline: gsap.core.Timeline) {
  const bridge = document.querySelector('.story-bridge');
  if (!bridge) return;
  gsap.set(bridge, { opacity: 0 });
  for (const [from, to] of [
    [3, 11],
    [17, 23],
    [29, 35],
    [41, 47],
    [53, 59],
    [65, 71],
    [77, 81],
    [91, 96],
  ]) {
    const half = (to - from) / 2;
    timeline.fromTo(
      bridge,
      { xPercent: -90, y: 70, rotation: -22, scale: 0.35, opacity: 0 },
      {
        xPercent: 0,
        y: 0,
        rotation: 5,
        scale: 1,
        opacity: 0.9,
        duration: half,
        ease: 'power2.inOut',
        immediateRender: false,
      },
      from,
    );
    timeline.to(
      bridge,
      {
        xPercent: 100,
        y: -80,
        rotation: 25,
        scale: 0.5,
        opacity: 0,
        duration: half,
        ease: 'power2.inOut',
      },
      from + half,
    );
  }
}
