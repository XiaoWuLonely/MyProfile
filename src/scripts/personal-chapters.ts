import type { gsap as animationEngine } from 'gsap';
type Timeline = ReturnType<typeof animationEngine.timeline>;
export function personalChapters(timeline: Timeline) {
  timeline.set('.envelope-wing', { zIndex: 4 }, 0);
  timeline.fromTo(
    '.envelope-wing',
    { rotationX: 0 },
    { rotationX: -180, duration: 1.5, ease: 'power2.inOut' },
    93.3,
  );
  // Switch behind the letter while the lid is edge-on; reversing restores it.
  timeline.set('.envelope-wing', { zIndex: 1 }, 94.05);
  timeline.fromTo(
    '.letter-paper',
    { yPercent: 61 },
    { yPercent: 0, duration: 1.6, ease: 'power2.out' },
    94.1,
  );
  timeline.fromTo(
    '.wax-seal',
    { scale: 1, opacity: 1 },
    { scale: 0.6, opacity: 0, duration: 0.5, ease: 'power1.in' },
    93.1,
  );
  const skills = document.querySelectorAll('[data-skill]');
  timeline.fromTo(
    skills,
    { y: 40, scale: 0.75, opacity: 0, rotation: (i) => (i % 2 ? -12 : 12) },
    {
      y: 0,
      scale: 1,
      opacity: 1,
      rotation: 0,
      duration: 0.65,
      stagger: 0.2,
      ease: 'back.out(1.2)',
    },
    69.7,
  );
  timeline.to(skills, { y: -25, opacity: 0, duration: 0.7, stagger: 0.15 }, 77);
  document.querySelectorAll('[data-year]').forEach((note, index) => {
    timeline.fromTo(
      note,
      { y: 45, scale: 0.82, opacity: 0, rotation: index % 2 ? -7 : 7 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.7,
        ease: 'power3.out',
      },
      81 + index * 2,
    );
  });
  const thread = document.querySelector<SVGPathElement>(
    '.growth-thread [data-draw]',
  );
  if (thread) {
    const length = thread.getTotalLength();
    timeline.fromTo(
      thread,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration: 10, ease: 'none' },
      79,
    );
  }
  timeline.to(
    '.journey-ribbon',
    {
      scaleX: 0.25,
      scaleY: 0.7,
      rotation: -12,
      x: 180,
      opacity: 0,
      duration: 2,
      ease: 'power2.inOut',
    },
    91,
  );
}
