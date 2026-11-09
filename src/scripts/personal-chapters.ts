import type { gsap as animationEngine } from 'gsap';
import { storyScenes } from './story-data';
type Timeline = ReturnType<typeof animationEngine.timeline>;
export function personalChapters(timeline: Timeline) {
  const about = storyScenes.find((s) => s.id === 'about')!;
  const journey = storyScenes.find((s) => s.id === 'journey')!;
  const contact = storyScenes.find((s) => s.id === 'contact')!;
  const contactEntry = contact.read - contact.start;
  const journeyEntry = journey.read - journey.start;
  timeline.set('.envelope-wing', { zIndex: 4 }, 0);
  timeline.fromTo(
    '.envelope-wing',
    { rotationX: 0 },
    { rotationX: -180, duration: contactEntry * 0.5, ease: 'power2.inOut' },
    contact.start + contactEntry * 0.1,
  );
  // Switch behind the letter while the lid is edge-on; reversing restores it.
  timeline.set(
    '.envelope-wing',
    { zIndex: 1 },
    contact.start + contactEntry * 0.35,
  );
  timeline.fromTo(
    '.letter-paper',
    { yPercent: 61 },
    { yPercent: 0, duration: contactEntry * 0.53, ease: 'power2.out' },
    contact.start + contactEntry * 0.37,
  );
  timeline.fromTo(
    '.wax-seal',
    { scale: 1, opacity: 1 },
    {
      scale: 0.6,
      opacity: 0,
      duration: contactEntry * 0.17,
      ease: 'power1.in',
    },
    contact.start + contactEntry * 0.035,
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
    about.start + 0.7,
  );
  timeline.to(
    skills,
    { y: -25, opacity: 0, duration: 0.7, stagger: 0.15 },
    about.leave,
  );
  document.querySelectorAll('[data-year]').forEach((note, index) => {
    timeline.fromTo(
      note,
      { y: 45, scale: 0.82, opacity: 0, rotation: index % 2 ? -7 : 7 },
      {
        y: 0,
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: journeyEntry * 0.3,
        ease: 'power3.out',
      },
      journey.start + journeyEntry * (0.08 + index * 0.17),
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
      { strokeDashoffset: 0, duration: journeyEntry, ease: 'none' },
      journey.start,
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
      duration: journey.end - journey.leave,
      ease: 'power2.inOut',
    },
    journey.leave,
  );
}
