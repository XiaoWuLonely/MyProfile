import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ScrollSmoother } from 'gsap/ScrollSmoother';
import { storyScenes, storyAnchors, cameraPosition } from './story-data';
import { createStoryTimeline } from './story-timeline';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
export const worldState = { progress: 0, travel: 0 };

const desktopScreenCount = 22;
const mobileScreenCount = 18;

export function initializeStory() {
  const stage = document.querySelector<HTMLElement>('#story-stage');
  if (!stage) return () => {};
  const events = new AbortController();
  const desktop = matchMedia('(min-width:1024px) and (pointer:fine)');
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const reading = new URLSearchParams(location.search).has('reading');
  const panels = [...stage.querySelectorAll<HTMLElement>('[data-story-panel]')];
  const chapterLabel = document.querySelector('.reading-current');
  const progressLine = document.querySelector<HTMLElement>(
    '.reading-line > span',
  );
  const navLinks = document.querySelectorAll<HTMLAnchorElement>('.site-nav a');
  const terrain = stage.querySelector<HTMLElement>('.paper-terrain');
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
  let smootherPlugin: typeof ScrollSmoother | null | undefined;
  let smootherLoad: Promise<void> | undefined;
  let jump: ((p: number) => void) | undefined;
  let pendingProgress = () => preserved;
  let freezeScroll = () => {};
  let disposeMode = () => {};
  const originalRestoration = history.scrollRestoration;
  const seek = () => {
    const p = hashProgress();
    if (p === undefined || reading || reduce.matches) return;
    preserved = p;
    if (!switching) jump?.(p);
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
    const isDesktop = desktop.matches;
    const smooth = isDesktop
      ? smootherPlugin?.create({
          wrapper: '#smooth-wrapper',
          content: '#smooth-content',
          smooth: 0.8,
          effects: false,
          // The pinned stage owns geometry refreshes and restores the story pose.
          autoResize: false,
        })
      : undefined;
    const timeline = createStoryTimeline(stage, isDesktop, worldState);
    let disposed = false;
    let ready = false;
    let refreshing = false;
    let shownProgress = '';
    let shownScene = '';
    let shownGroup = '';
    let shownTravel: number | undefined;
    let observedScrollY = scrollY;
    const collectPendingProgress = () => {
      if (!trigger || Math.abs(scrollY - observedScrollY) <= 1)
        return preserved;
      return gsap.utils.clamp(
        0,
        100,
        preserved +
          ((scrollY - observedScrollY) / (trigger.end - trigger.start)) * 100,
      );
    };
    pendingProgress = collectPendingProgress;
    freezeScroll = () => {
      // A viewport change may clamp the native offset. Only new input after
      // freezing should move the saved pose while a rebuild is pending.
      if (ready && !switching) observedScrollY = scrollY;
    };
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
        freezeScroll();
        switching = true;
        generation++;
        clearTimeout(timer);
        timer = setTimeout(rebuild, 120);
        return;
      }
      const p = timeline.time();
      if (ready) preserved = p;
      observedScrollY = scrollY;
      if (p > 0 && intro) finishIntro();
      worldState.progress = p;
      const travel = (worldState.travel = cameraPosition(p));
      const progress = p.toFixed(3);
      if (progress !== shownProgress) {
        shownProgress = progress;
        stage.dataset.progress = progress;
        if (progressLine) progressLine.style.transform = `scaleX(${p / 100})`;
      }
      if (travel !== shownTravel) {
        shownTravel = travel;
        stage.dataset.travel = travel.toFixed(4);
        if (terrain) {
          const x = Math.sin(travel * 0.8) * -45;
          const scale = 1 + Math.sin(travel * 0.4) * 0.07;
          const angle = Math.sin(travel * 0.7) * 2;
          terrain.style.transform = `translate3d(${x}px, 0, 0) rotate(${angle}deg) scale(${scale})`;
        }
      }
      const current =
        storyScenes.find((s) => p >= s.start && p < s.end) ??
        storyScenes.at(-1)!;
      if (current.id === shownScene) return;
      shownScene = current.id;
      stage.dataset.scene = current.id;
      if (chapterLabel && chapterLabel.textContent !== current.label)
        chapterLabel.textContent = current.label;
      panels.forEach((panel) => {
        const inert = panel.id !== current.id;
        if (panel.inert !== inert) panel.inert = inert;
      });
      const group = current.id.startsWith('project-') ? 'works' : current.id;
      if (group === shownGroup) return;
      shownGroup = group;
      navLinks.forEach((link) => {
        if (link.hash === `#${group}`)
          link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
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
      if (smooth) {
        if (
          Math.abs(smooth.scrollTop() - target) > 1 ||
          Math.abs(scrollY - target) > 1
        ) {
          smooth.scrollTop(target);
          smooth.scrollTrigger.update();
          smooth.scrollTrigger.getTween()?.progress(1);
        }
      } else if (Math.abs(scrollY - target) > 1) {
        // Set the native offset through ScrollTrigger to update its scroll cache.
        trigger.scroll(target);
        trigger.update();
      }
      timeline.time(p);
      observedScrollY = scrollY;
      refreshing = previous;
      render();
    };
    jump = restore;
    const beginRefresh = () => {
      if (!ready || switching) return;
      // A native scroll can move the viewport before its event updates the timeline.
      if (!smooth) preserved = collectPendingProgress();
      refreshing = true;
    };
    const finishRefresh = () => {
      if (!refreshing || disposed || !trigger) return;
      stage.dataset.scrollDistance = (trigger.end - trigger.start).toFixed(0);
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
      end: () =>
        `+=${innerHeight * (isDesktop ? desktopScreenCount : mobileScreenCount)}`,
      pin: stage,
      animation: timeline,
      scrub: true,
      invalidateOnRefresh: true,
    });
    ScrollTrigger.refresh();
    stage.dataset.scrollDistance = (trigger.end - trigger.start).toFixed(0);
    restore(preserved);
    frame = requestAnimationFrame(() => {
      if (disposed || !trigger || currentGeneration !== generation) return;
      preserved = collectPendingProgress();
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
      smooth?.kill();
      jump = undefined;
      pendingProgress = () => preserved;
      freezeScroll = () => {};
      document.documentElement.classList.remove('story-active');
      terrain?.style.removeProperty('transform');
      gsap.set(panels, { clearProps: 'opacity,visibility' });
      panels.forEach((panel) => {
        panel.inert = false;
      });
    };
  };
  const mountMode = () => {
    size = { width: innerWidth, height: innerHeight };
    if (
      reading ||
      reduce.matches ||
      !desktop.matches ||
      smootherPlugin !== undefined
    ) {
      disposeMode = mount();
      return;
    }
    const requestedGeneration = generation;
    const startY = scrollY;
    const startProgress = preserved;
    const startHash = location.hash;
    smootherLoad ??= import('gsap/ScrollSmoother')
      .then(({ ScrollSmoother }) => {
        gsap.registerPlugin(ScrollSmoother);
        smootherPlugin = ScrollSmoother;
      })
      .catch(() => {
        smootherPlugin = null;
      });
    // The static page stays readable during the desktop-only download.
    void smootherLoad.then(() => {
      if (events.signal.aborted || generation !== requestedGeneration) return;
      if (location.hash !== startHash) {
        preserved = hashProgress() ?? preserved;
      } else if (
        (!first || !startHash) &&
        preserved === startProgress &&
        Math.abs(scrollY - startY) > 1
      ) {
        const delta = (scrollY - startY) / (innerHeight * desktopScreenCount);
        preserved = gsap.utils.clamp(0, 100, preserved + delta * 100);
      }
      disposeMode = mount();
    });
  };
  const rebuild = () => {
    clearTimeout(timer);
    generation++;
    switching = true;
    const p = pendingProgress();
    // Cancel any native smooth-scroll left by the reading layout before rebuilding.
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    disposeMode();
    disposeMode = () => {};
    preserved = p;
    worldState.progress = p;
    worldState.travel = cameraPosition(p);
    mountMode();
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
    freezeScroll();
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
      freezeScroll();
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
  mountMode();
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
