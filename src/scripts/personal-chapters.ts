import type { gsap } from 'gsap';
export function personalChapters(timeline: gsap.core.Timeline) {
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
}
