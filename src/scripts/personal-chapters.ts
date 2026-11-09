import type { gsap as animationEngine } from 'gsap';
import { storyScenes } from './story-data';
type Timeline = ReturnType<typeof animationEngine.timeline>;
export function personalChapters(timeline: Timeline) {
  const about = storyScenes.find((s) => s.id === 'about')!;
  const journey = storyScenes.find((s) => s.id === 'journey')!;
  const contact = storyScenes.find((s) => s.id === 'contact')!;
  const contactEntry = contact.read - contact.start;
  const journeyEntry = journey.read - journey.start;
  const aboutEntry = about.read - about.start;
  timeline.fromTo(
    '.about-panel .note-board',
    { clipPath: 'inset(0 100% 0 0)', y: 10 },
    {
      clipPath: 'inset(0 0% 0 0)',
      y: 0,
      duration: aboutEntry * 0.8,
      ease: 'power2.out',
    },
    about.start + 0.1,
  );
  timeline.fromTo(
    '.about-panel .chapter-copy',
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: aboutEntry * 0.65, ease: 'power2.out' },
    about.start + aboutEntry * 0.3,
  );
  timeline.to(
    '.about-panel .note-board,.about-panel .chapter-copy',
    { opacity: 0, duration: 0.65, ease: 'power1.in' },
    about.leave,
  );
  timeline.fromTo(
    '.journey-panel .chapter-copy',
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: journeyEntry * 0.3 },
    journey.start,
  );
  timeline.fromTo(
    '.journey-whisper',
    { opacity: 0 },
    { opacity: 1, duration: 0.3 },
    journey.read - 0.3,
  );
  timeline.to(
    '.journey-panel .chapter-copy,.journey-ribbon,.journey-whisper',
    { opacity: 0, duration: 0.65 },
    journey.leave,
  );
  timeline.fromTo(
    '.contact-panel .chapter-copy',
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: contactEntry * 0.4, ease: 'power2.out' },
    contact.start + contactEntry * 0.6,
  );
  timeline.fromTo(
    '.envelope-art',
    { y: 12, rotationZ: -2 },
    { y: 0, rotationZ: 0, duration: contactEntry, ease: 'power2.out' },
    contact.start,
  );
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
    { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
    {
      clipPath: 'inset(0 0% 0 0)',
      opacity: 1,
      duration: aboutEntry * 0.25,
      stagger: aboutEntry * 0.1,
      ease: 'none',
    },
    about.start + aboutEntry * 0.3,
  );
  document.querySelectorAll('[data-year]').forEach((note, index) => {
    timeline.fromTo(
      note,
      { clipPath: 'inset(0 100% 0 0)', opacity: 0 },
      {
        clipPath: 'inset(0 0% 0 0)',
        opacity: 1,
        duration: journeyEntry * 0.3,
        ease: 'none',
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
  for (const [selector, start, duration] of [
    [
      '.note-line [data-draw]',
      about.start + aboutEntry * 0.25,
      aboutEntry * 0.7,
    ],
    [
      '.letter-paper [data-draw]',
      contact.start + contactEntry * 0.6,
      contactEntry * 0.35,
    ],
  ] as const) {
    const path = document.querySelector<SVGPathElement>(selector);
    if (!path) continue;
    const length = path.getTotalLength();
    timeline.fromTo(
      path,
      { strokeDasharray: length, strokeDashoffset: length },
      { strokeDashoffset: 0, duration, ease: 'none' },
      start,
    );
  }
}
