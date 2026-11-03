import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { storyScenes, storyAnchors, cameraPosition } from './story-data';
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
export const worldState = { progress: 0, travel: 0 };

export function initializeStory() {
  const stage = document.querySelector<HTMLElement>('#story-stage');
  if (!stage) return () => {};
  const media = gsap.matchMedia();
  const events = new AbortController();
  let trigger: ScrollTrigger | undefined;
  let smoother: ScrollSmoother | undefined;
  let preserved = 0;
  let first = true;
  let frame = 0;
  const params = new URLSearchParams(location.search);
  const reading = params.has('reading');
  const panels = [...stage.querySelectorAll<HTMLElement>('[data-story-panel]')];
  const seek = () => {
    if (!trigger || !smoother) return;
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1)) || 'home';
    } catch {
      return;
    }
    const p = storyAnchors[id];
    if (p === undefined) return;
    smoother.scrollTo(
      trigger.start + ((trigger.end - trigger.start) * p) / 100,
      false,
    );
    ScrollTrigger.update();
  };
  window.addEventListener('hashchange', seek, { signal: events.signal });
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!link || !trigger || event.metaKey || event.ctrlKey || event.shiftKey)
        return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      seek();
    },
    { signal: events.signal },
  );
  window.addEventListener('popstate', seek, { signal: events.signal });
  media.add(
    {
      desktop: '(min-width:1024px) and (pointer:fine)',
      small: '(max-width:1023px), (pointer:coarse)',
      reduce: '(prefers-reduced-motion:reduce)',
    },
    (context) => {
      if (reading || context.conditions?.reduce) {
        document.documentElement.dataset.experience = 'reading';
        return;
      }
      const desktop = !!context.conditions?.desktop;
      document.documentElement.classList.add('story-active');
      document.documentElement.dataset.experience = 'journey';
      smoother = ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 0.8,
        smoothTouch: 0.12,
        effects: false,
      });
      const timeline = gsap.timeline({ paused: true });
      let intro: gsap.core.Timeline | undefined;
      const finishIntro = () => {
        const active = intro;
        intro = undefined;
        if (active) {
          active.progress(1);
          active.kill();
        }
        stage.dataset.intro = 'done';
      };
      gsap.set(panels, { autoAlpha: 0 });
      storyScenes.forEach((scene) => {
        const panel = document.getElementById(scene.id)!;
        const entry = scene.read - scene.start;
        const exit = scene.end - scene.leave;
        const animateFrom = (
          selector: string,
          from: gsap.TweenVars,
          to: gsap.TweenVars,
          at: number,
        ) => {
          const targets = panel.querySelectorAll(selector);
          if (targets.length) timeline.fromTo(targets, from, to, at);
        };
        const animateTo = (
          selector: string,
          to: gsap.TweenVars,
          at: number,
        ) => {
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
      timeline.to(
        worldState,
        { progress: 100, duration: 100, ease: 'none' },
        0,
      );
      const render = () => {
        const p = timeline.time();
        if (p > 0 && intro) finishIntro();
        worldState.progress = p;
        worldState.travel = cameraPosition(p);
        stage.dataset.progress = p.toFixed(3);
        const current =
          storyScenes.find((s) => p >= s.start && p < s.end) ??
          storyScenes[storyScenes.length - 1];
        stage.dataset.scene = current.id;
        const label = document.querySelector('.reading-current');
        if (label) label.textContent = current.label;
        const progress = document.querySelector<HTMLElement>(
          '.reading-line > span',
        );
        if (progress) progress.style.transform = `scaleX(${p / 100})`;
        panels.forEach((panel) => {
          panel.inert = panel.id !== current.id;
        });
        document
          .querySelectorAll<HTMLAnchorElement>('.site-nav a')
          .forEach((link) => {
            const group = current.id.startsWith('project-')
              ? 'works'
              : current.id;
            if (link.hash === `#${group}`)
              link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        gsap.set('.paper-terrain', {
          x: Math.sin(worldState.travel * 0.8) * -45,
          scale: 1 + Math.sin(worldState.travel * 0.4) * 0.07,
          rotation: Math.sin(worldState.travel * 0.7) * 2,
        });
      };
      trigger = ScrollTrigger.create({
        id: 'paper-story',
        trigger: stage,
        start: 'top top',
        end: () => `+=${innerHeight * (desktop ? 20 : 16)}`,
        pin: stage,
        animation: timeline,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: render,
      });
      ScrollTrigger.refresh();
      frame = requestAnimationFrame(() => {
        const playIntro =
          first && (!location.hash || location.hash === '#home');
        if (first && location.hash) seek();
        else if (!first)
          smoother?.scrollTo(
            trigger!.start + (trigger!.end - trigger!.start) * preserved,
            false,
          );
        first = false;
        render();
        if (playIntro) {
          stage.dataset.intro = 'playing';
          intro = gsap.timeline({
            onComplete: () => {
              stage.dataset.intro = 'done';
              intro = undefined;
            },
          });
          intro
            .fromTo(
              '.opening-sheet',
              { x: 120, y: -70, rotationY: 35, opacity: 0.3 },
              {
                x: 0,
                y: 0,
                rotationY: 0,
                opacity: 1,
                duration: 1.2,
                ease: 'power3.out',
              },
              0,
            )
            .fromTo(
              '.opening-collage [data-piece]',
              {
                x: (i) => (i % 2 ? 1 : -1) * 200,
                y: -80,
                rotationZ: (i) => (i % 2 ? 20 : -20),
                opacity: 0,
              },
              {
                x: 0,
                y: 0,
                rotationZ: 0,
                opacity: 1,
                duration: 1,
                stagger: 0.08,
                ease: 'power3.out',
              },
              0,
            );
        } else stage.dataset.intro = 'done';
      });
      return () => {
        preserved = trigger?.progress ?? 0;
        finishIntro();
        cancelAnimationFrame(frame);
        trigger?.kill();
        trigger = undefined;
        timeline.revert();
        smoother?.kill();
        smoother = undefined;
        document.documentElement.classList.remove('story-active');
        panels.forEach((p) => {
          p.inert = false;
        });
      };
    },
  );
  return () => {
    events.abort();
    cancelAnimationFrame(frame);
    media.revert();
    delete document.documentElement.dataset.experience;
  };
}
