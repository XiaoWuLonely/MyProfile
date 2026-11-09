import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { storyScenes, storyAnchors, cameraPosition } from './story-data';
import { createStoryTimeline } from './story-timeline';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
ScrollTrigger.config({ ignoreMobileResize: true });
export const worldState = { progress: 0, travel: 0 };

export function initializeStory() {
  const stage = document.querySelector<HTMLElement>('#story-stage');
  if (!stage) return () => {};
  const events = new AbortController();
  const desktop = matchMedia('(min-width:1024px) and (pointer:fine)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const reading = new URLSearchParams(location.search).has('reading');
  const panels = [...stage.querySelectorAll<HTMLElement>('[data-story-panel]')];
  const hashProgress = () => {
    try {
      return storyAnchors[decodeURIComponent(location.hash.slice(1)) || 'home'];
    } catch {
      return undefined;
    }
  };
  let preserved = hashProgress() ?? 0;
  let switching = true;
  let first = true;
  let generation = 0;
  let frame = 0;
  let timer: ReturnType<typeof setTimeout>;
  let size = { width: innerWidth, height: innerHeight };
  let trigger: ScrollTrigger | undefined;
  let smoother: ScrollSmoother | undefined;
  let jump: ((p: number) => void) | undefined;
  let disposeMode = () => {};
  const originalRestoration = history.scrollRestoration;
  const seek = () => {
    const p = hashProgress();
    if (p === undefined || !trigger || !smoother) return;
    clearTimeout(timer);
    preserved = p;
    jump?.(p);
  };
  const mount = () => {
    size = { width: innerWidth, height: innerHeight };
    const currentGeneration = generation;
    if (reading || reduce.matches) {
      document.documentElement.dataset.experience = 'reading';
      history.scrollRestoration = originalRestoration;
      switching = false;
      return () => {};
    }
    document.documentElement.classList.add('story-active');
    document.documentElement.dataset.experience = 'journey';
    history.scrollRestoration = 'manual';
    const smooth = (smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 0.8,
      smoothTouch: 0.12,
      effects: false,
      // This pinned stage owns geometry refreshes; a second observer can replay
      // the smoother's previous scrub after the new position has been restored.
      autoResize: false,
    }));
    const timeline = createStoryTimeline(stage, desktop.matches, worldState);
    let disposed = false;
    let ready = false;
    let refreshing = false;
    const mountedSize = { width: innerWidth, height: innerHeight };
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
    const render = () => {
      if (
        disposed ||
        switching ||
        refreshing ||
        currentGeneration !== generation
      )
        return;
      if (
        reduce.matches ||
        innerWidth !== mountedSize.width ||
        Math.abs(innerHeight - mountedSize.height) >= 120
      ) {
        switching = true;
        generation++;
        clearTimeout(timer);
        timer = setTimeout(rebuild, 120);
        return;
      }
      const p = timeline.time();
      if (ready) preserved = p;
      if (p > 0 && intro) finishIntro();
      worldState.progress = p;
      worldState.travel = cameraPosition(p);
      stage.dataset.progress = p.toFixed(3);
      stage.dataset.travel = worldState.travel.toFixed(4);
      if (trigger)
        stage.dataset.scrollDistance = (trigger.end - trigger.start).toFixed(0);
      const current =
        storyScenes.find((s) => p >= s.start && p < s.end) ??
        storyScenes.at(-1)!;
      stage.dataset.scene = current.id;
      const label = document.querySelector('.reading-current');
      if (label) label.textContent = current.label;
      const line = document.querySelector<HTMLElement>('.reading-line > span');
      if (line) line.style.transform = `scaleX(${p / 100})`;
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
    timeline.eventCallback('onUpdate', render);
    const restore = (p: number) => {
      if (!trigger) return;
      const previous = refreshing;
      refreshing = true;
      const target = trigger.start + ((trigger.end - trigger.start) * p) / 100;
      // Native scroll positions are pixel-quantized; repeating the same target
      // would re-arm ScrollSmoother's proxy without producing a scroll event.
      if (
        Math.abs(smooth.scrollTop() - target) > 1 ||
        Math.abs(scrollY - target) > 1
      ) {
        smooth.scrollTop(target);
        smooth.scrollTrigger.update();
        smooth.scrollTrigger.getTween()?.progress(1);
      }
      timeline.time(p);
      refreshing = previous;
      render();
    };
    jump = restore;
    const beginRefresh = () => {
      if (ready && !switching) refreshing = true;
    };
    const finishRefresh = () => {
      if (!refreshing || disposed || !trigger) return;
      const p = preserved;
      restore(p);
      refreshing = false;
      render();
    };
    ScrollTrigger.addEventListener('refreshInit', beginRefresh);
    ScrollTrigger.addEventListener('refresh', finishRefresh);
    trigger = ScrollTrigger.create({
      id: 'paper-story',
      trigger: stage,
      start: 'top top',
      end: () => `+=${innerHeight * (desktop.matches ? 20 : 16)}`,
      pin: stage,
      animation: timeline,
      scrub: true,
      invalidateOnRefresh: true,
    });
    ScrollTrigger.refresh();
    restore(preserved);
    frame = requestAnimationFrame(() => {
      if (disposed || !trigger || currentGeneration !== generation) return;
      restore(preserved);
      switching = false;
      ready = true;
      render();
      const playIntro =
        first &&
        preserved === 0 &&
        (!location.hash || location.hash === '#home');
      first = false;
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
      disposed = true;
      ready = false;
      finishIntro();
      cancelAnimationFrame(frame);
      ScrollTrigger.removeEventListener('refreshInit', beginRefresh);
      ScrollTrigger.removeEventListener('refresh', finishRefresh);
      trigger?.kill();
      trigger = undefined;
      timeline.revert();
      smooth.kill();
      smoother = undefined;
      jump = undefined;
      document.documentElement.classList.remove('story-active');
      gsap.set(panels, { clearProps: 'opacity,visibility' });
      panels.forEach((panel) => {
        panel.inert = false;
      });
    };
  };
  const rebuild = () => {
    clearTimeout(timer);
    generation++;
    switching = true;
    const p = preserved;
    // Cancel any native smooth-scroll left by the reading layout before rebuilding.
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    disposeMode();
    preserved = p;
    worldState.progress = p;
    worldState.travel = cameraPosition(p);
    disposeMode = mount();
    if (reading || reduce.matches) {
      const current =
        storyScenes.find((s) => p >= s.start && p < s.end) ??
        storyScenes.at(-1)!;
      if (p > 0)
        document
          .getElementById(current.id)
          ?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  };
  const mediaChange = () => {
    switching = true;
    rebuild();
  };
  desktop.addEventListener('change', mediaChange);
  reduce.addEventListener('change', mediaChange);
  window.addEventListener(
    'resize',
    () => {
      if (
        innerWidth === size.width &&
        Math.abs(innerHeight - size.height) < 120
      )
        return;
      size = { width: innerWidth, height: innerHeight };
      switching = true;
      generation++;
      clearTimeout(timer);
      timer = setTimeout(rebuild, 120);
    },
    { signal: events.signal },
  );
  window.addEventListener('hashchange', seek, { signal: events.signal });
  window.addEventListener('popstate', seek, { signal: events.signal });
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (
        !link ||
        !trigger ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      seek();
    },
    { signal: events.signal },
  );
  disposeMode = mount();
  return () => {
    switching = true;
    events.abort();
    clearTimeout(timer);
    disposeMode();
    desktop.removeEventListener('change', mediaChange);
    reduce.removeEventListener('change', mediaChange);
    history.scrollRestoration = originalRestoration;
    delete document.documentElement.dataset.experience;
  };
}
