import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initializeMotion() {
  const media = gsap.matchMedia();
  const progress = gsap.context(() => {
    gsap.to('.reading-line > span', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: true },
    });
  });
  media.add(
    {
      desktop: '(min-width: 1024px)',
      mobile: '(max-width: 1023px)',
      reduce: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      if (context.conditions?.reduce) {
        document.documentElement.dataset.motion = 'reduced';
        return;
      }
      document.documentElement.dataset.motion = 'active';
      const desktop = context.conditions?.desktop;
      document
        .querySelectorAll<HTMLElement>('[data-reveal]')
        .forEach((element) => {
          gsap.fromTo(
            element,
            { y: desktop ? 34 : 18, opacity: 0.25 },
            {
              y: 0,
              opacity: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: element,
                start: 'top 97%',
                end: 'top 72%',
                scrub: 0.25,
              },
            },
          );
        });
      gsap.to('.hero-art img', {
        yPercent: desktop ? 10 : 4,
        scale: 1.035,
        ease: 'none',
        scrollTrigger: {
          trigger: '#home',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
        },
      });
      gsap.fromTo(
        '.torn-edge',
        { scaleY: 2.8 },
        {
          scaleY: 1,
          transformOrigin: 'center bottom',
          ease: 'none',
          scrollTrigger: {
            trigger: '#home',
            start: 'bottom 85%',
            end: 'bottom 20%',
            scrub: 0.3,
          },
        },
      );
      gsap.fromTo(
        '.about-art-paper',
        { rotationY: -10, y: 20 },
        {
          rotationY: 0,
          y: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '#about',
            start: 'top 85%',
            end: 'center 50%',
            scrub: 0.4,
          },
        },
      );
      const path = document.querySelector<SVGPathElement>('.path-drawn');
      if (path && desktop) {
        const length = path.getTotalLength();
        gsap.fromTo(
          path,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: '#journey',
              start: 'top 65%',
              end: 'bottom 65%',
              scrub: 0.5,
            },
          },
        );
      }
      gsap.to('.envelope-flap', {
        rotationX: -150,
        opacity: 0.12,
        ease: 'none',
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 85%',
          end: 'center 60%',
          scrub: 0.4,
        },
      });
      const wind = gsap.to('.grass-stem', {
        rotation: 4,
        transformOrigin: '50% 100%',
        duration: 4.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        paused: true,
      });
      const windTrigger = ScrollTrigger.create({
        trigger: '#about',
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          wind.paused(!self.isActive || document.hidden);
        },
      });
      const visibility = () => {
        wind.paused(document.hidden || !windTrigger.isActive);
      };
      document.addEventListener('visibilitychange', visibility);
      return () => document.removeEventListener('visibilitychange', visibility);
    },
  );
  const onLoad = () => ScrollTrigger.refresh();
  window.addEventListener('load', onLoad, { once: true });
  document.fonts.ready.then(() => {
    if (!disposed) ScrollTrigger.refresh();
  });
  let disposed = false;
  return () => {
    disposed = true;
    media.revert();
    progress.revert();
    window.removeEventListener('load', onLoad);
    delete document.documentElement.dataset.motion;
  };
}
