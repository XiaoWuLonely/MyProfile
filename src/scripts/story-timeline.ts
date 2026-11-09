import { gsap } from 'gsap';
import { storyScenes } from './story-data';
import { stageProps } from './choreography';
import { personalChapters } from './personal-chapters';
import { choreographProject } from './project-scenes';
import { prepareStoryHandoffs } from './story-handoffs';

export function createStoryTimeline(
  stage: HTMLElement,
  desktop: boolean,
  clock: { progress: number },
) {
  const panels = [...stage.querySelectorAll<HTMLElement>('[data-story-panel]')];
  const timeline = gsap.timeline({ paused: true });
  const connect = prepareStoryHandoffs(stage, desktop);
  gsap.set(panels, { autoAlpha: 0 });
  storyScenes.forEach((scene) => {
    const panel = document.getElementById(scene.id)!;
    const entry = scene.read - scene.start;
    const exit = scene.end - scene.leave;
    if (choreographProject(timeline, panel, scene, desktop)) {
      timeline.fromTo(
        panel,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35 },
        scene.start,
      );
      timeline.to(panel, { autoAlpha: 0, duration: 0.4 }, scene.end - 0.4);
      return;
    }
    stageProps(timeline, panel, scene);
    const animateFrom = (
      selector: string,
      from: gsap.TweenVars,
      to: gsap.TweenVars,
      at: number,
    ) => {
      const targets = panel.querySelectorAll(selector);
      if (targets.length) timeline.fromTo(targets, from, to, at);
    };
    const animateTo = (selector: string, to: gsap.TweenVars, at: number) => {
      const targets = panel.querySelectorAll(selector);
      if (targets.length) timeline.to(targets, to, at);
    };
    if (scene.id === 'home') timeline.set(panel, { autoAlpha: 1 }, 0);
    else
      timeline.fromTo(
        panel,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: Math.min(0.8, entry), ease: 'none' },
        scene.start,
      );
    if (entry > 0) {
      animateFrom(
        '[data-board],.note-board,.envelope-art',
        {
          y: desktop ? 110 : 55,
          rotationY: desktop ? 22 : 7,
          rotationZ: -5,
          scale: 0.85,
        },
        {
          y: 0,
          rotationY: 0,
          rotationZ: 0,
          scale: 1,
          duration: entry,
          ease: 'power2.out',
        },
        scene.start,
      );
      animateFrom(
        '[data-piece]',
        {
          x: (i) => (i % 2 ? 1 : -1) * (desktop ? 450 : 180),
          y: (i) => (i % 2 ? -180 : 130),
          z: -300,
          rotationZ: (i) => (i % 2 ? 35 : -30),
        },
        {
          x: 0,
          y: 0,
          z: 0,
          rotationZ: 0,
          duration: entry * 0.88,
          stagger: entry * 0.035,
          ease: 'power3.out',
        },
        scene.start,
      );
      animateFrom(
        '.scene-copy,.chapter-copy',
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: entry * 0.4, ease: 'power2.out' },
        scene.start + entry * 0.6,
      );
      animateFrom(
        '[data-line]',
        { scaleX: 0 },
        { scaleX: 1, duration: entry * 0.7, ease: 'none' },
        scene.start + entry * 0.3,
      );
    }
    if (exit > 0) {
      animateTo(
        '.scene-copy,.chapter-copy',
        { y: -16, opacity: 0, duration: exit * 0.4, ease: 'power1.in' },
        scene.leave,
      );
      animateTo(
        '[data-board],.note-board,.envelope-art',
        {
          y: -50,
          rotationX: desktop ? -42 : -14,
          scale: 0.7,
          opacity: 0,
          duration: exit * 0.65,
          ease: 'power2.in',
        },
        scene.leave + exit * 0.35,
      );
      animateTo(
        '[data-piece]',
        {
          x: (i) => (i % 2 ? 1 : -1) * 180,
          rotationY: 60,
          opacity: 0,
          duration: exit * 0.65,
          stagger: 0,
          ease: 'power2.in',
        },
        scene.leave + exit * 0.35,
      );
      timeline.to(
        panel,
        { autoAlpha: 0, duration: Math.min(0.6, exit) },
        scene.end - Math.min(0.6, exit),
      );
    }
  });
  personalChapters(timeline);
  connect(timeline);
  timeline.to(clock, { progress: 100, duration: 100, ease: 'none' }, 0);

  return timeline;
}
