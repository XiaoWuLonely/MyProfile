import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { storyScenes } from './story-data';
import type { Timeline } from './stages/types';
import { preparePersonalPaper } from './story-ribbon';
import { scaledPaperPose, type PaperBox } from './paper-pose';
gsap.registerPlugin(MotionPathPlugin);

export function prepareStoryHandoffs(
  stage: HTMLElement,
  desktop: boolean,
): (timeline: Timeline) => void {
  const layer = stage.querySelector('.story-handoffs');
  if (!layer) return () => {};
  const frame = stage.getBoundingClientRect();
  const box = (
    selector: string,
    fallback?: string,
    projected = false,
  ): PaperBox => {
    let element = stage.querySelector(selector);
    if ((!element || !element.getBoundingClientRect().width) && fallback)
      element = stage.querySelector(fallback);
    if (!element)
      return {
        x: frame.width * 0.4,
        y: frame.height * 0.3,
        width: 120,
        height: 160,
      };
    const r = element.getBoundingClientRect();
    const width =
      !projected && element instanceof HTMLElement
        ? element.offsetWidth
        : r.width;
    const height =
      !projected && element instanceof HTMLElement
        ? element.offsetHeight
        : r.height;
    return {
      x: r.x - frame.x + (r.width - width) / 2,
      y: r.y - frame.y + (r.height - height) / 2,
      width,
      height,
    };
  };
  const home = storyScenes.find((s) => s.id === 'home')!,
    blog = storyScenes.find((s) => s.id === 'project-myblog')!,
    knowledge = storyScenes.find((s) => s.id === 'project-knowflow')!,
    field = storyScenes.find((s) => s.id === 'project-heyue')!,
    airport = storyScenes.find((s) => s.id === 'project-zhifu')!,
    food = storyScenes.find((s) => s.id === 'project-mcdonalds')!;
  const kEntry = knowledge.read - knowledge.start,
    fEntry = field.read - field.start,
    aEntry = airport.read - airport.start,
    mEntry = food.read - food.start;
  const opening = box('.opening-sheet'),
    coverTarget = box('.journal-leaf:first-child');
  const page = box('[data-transfer-page]', '.journal-leaf:nth-child(2)'),
    doc = box('.knowledge-node.node-0');
  const network = box('.knowledge-stage'),
    terrain = box('.field-terrain'),
    parcel = box('[data-field-parcel]');
  const airplane = box('[data-airport-plane]'),
    sign = box('[data-wayfinding]'),
    menu = box('.food-menu');
  const trend = box('.airport-insight svg', undefined, true),
    plate = box('.food-plate', undefined, true);
  const actor = (name: string) =>
    layer.querySelector(`[data-handoff="${name}"]`)!;
  const handoffPose = (from: PaperBox, to: PaperBox) => {
    if (desktop) return { from, to };
    const size = {
      width: Math.max(to.width, 1),
      height: Math.max(to.height, 1),
    };
    return {
      from: { ...size, ...scaledPaperPose(from, size) },
      to: scaledPaperPose(to, size),
    };
  };
  const personalPaper = preparePersonalPaper(stage, box, desktop);
  return (timeline) => {
    const cover = actor('cover');
    const coverEnd = blog.start + (blog.read - blog.start) * 0.25;
    const coverPose = handoffPose(opening, coverTarget);
    timeline.set(
      cover,
      { ...coverPose.from, rotationZ: 5, autoAlpha: 1 },
      home.leave,
    );
    timeline.to(
      cover,
      {
        ...coverPose.to,
        rotationZ: -2,
        backgroundColor: '#a44c32',
        duration: coverEnd - home.leave,
        ease: 'power2.inOut',
      },
      home.leave,
    );
    timeline.to(
      cover,
      { autoAlpha: 0, duration: 0.25 },
      blog.start + (blog.read - blog.start) * 0.65,
    );

    const docPaper = actor('document');
    const docEnd = knowledge.start + kEntry * 0.2,
      docDuration = docEnd - blog.leave;
    const docPose = handoffPose(page, doc);
    timeline.set(
      docPaper,
      {
        ...docPose.from,
        rotationZ: -2,
        autoAlpha: 1,
        '--handoff-paper': '#e5dac1',
      },
      blog.leave,
    );
    timeline.to(
      docPaper,
      {
        ...docPose.to,
        rotationZ: -9,
        '--handoff-paper': '#fbf7ed',
        duration: docDuration,
        ease: 'power2.inOut',
      },
      blog.leave,
    );
    const shards = docPaper.querySelectorAll('.paper-shard');
    timeline.fromTo(
      shards,
      { x: 0, y: 0, rotation: 0 },
      {
        x: (i: number) => (i ? 1 : -1) * (desktop ? 22 : 12),
        y: (i: number) => (i ? 7 : -7),
        rotation: (i: number) => (i ? 7 : -7),
        duration: docDuration * 0.25,
        ease: 'power2.out',
      },
      blog.leave + docDuration * 0.18,
    );
    timeline.to(
      shards,
      {
        x: 0,
        y: 0,
        rotation: 0,
        duration: docDuration * 0.25,
        ease: 'power2.inOut',
      },
      blog.leave + docDuration * 0.54,
    );
    timeline.to(
      docPaper,
      { autoAlpha: 0, duration: kEntry * 0.05 },
      knowledge.start + kEntry * 0.35,
    );

    const threads = actor('threads');
    const threadEnd = field.start + fEntry * 0.25;
    const threadPose = handoffPose(
      {
        x: network.x + network.width * 0.12,
        y: network.y + network.height * 0.45,
        width: network.width * 0.74,
        height: network.height * 0.25,
      },
      terrain,
    );
    timeline.set(
      threads,
      {
        ...threadPose.from,
        rotationX: 0,
        rotationZ: 0,
        autoAlpha: 0,
      },
      knowledge.leave,
    );
    timeline.to(threads, { autoAlpha: 1, duration: 0.3 }, knowledge.leave);
    timeline.to(
      threads,
      {
        ...threadPose.to,
        rotationX: 53,
        rotationZ: -16,
        duration: threadEnd - knowledge.leave,
        ease: 'power2.inOut',
      },
      knowledge.leave,
    );
    threads.querySelectorAll('path').forEach((path, i) => {
      const x = 150 + i * 150;
      timeline.to(
        path,
        {
          attr: { d: `M${x} 0C${x} 40 ${x} 70 ${x} 90S${x} 140 ${x} 180` },
          duration: threadEnd - knowledge.leave,
          ease: 'power2.inOut',
        },
        knowledge.leave,
      );
    });
    timeline.to(threads, { autoAlpha: 0, duration: fEntry * 0.1 }, threadEnd);

    const flight = actor('flight');
    const flightEnd = airport.start + aEntry * 0.16,
      duration = flightEnd - field.leave;
    const planeWidth = Math.max(45, Math.min(130, airplane.width)),
      planeHeight = planeWidth * 0.6;
    const flightPose = handoffPose(parcel, {
      x: airplane.x - frame.width * 0.055,
      y: airplane.y + frame.height * 0.025,
      width: planeWidth,
      height: planeHeight,
    });
    const { x: planeX, y: planeY, ...planeSize } = flightPose.to;
    timeline.set(
      flight,
      {
        ...flightPose.from,
        rotation: 0,
        autoAlpha: 0,
        backgroundColor: '#bd966b',
      },
      field.leave,
    );
    timeline.to(
      flight,
      { autoAlpha: 1, duration: duration * 0.15 },
      field.leave,
    );
    timeline.to(
      flight,
      {
        motionPath: {
          path: [
            { x: flightPose.from.x, y: flightPose.from.y },
            { x: frame.width * 0.65, y: frame.height * 0.3 },
            {
              x: frame.width * 0.25,
              y: frame.height * (desktop ? 0.18 : 0.22),
            },
            { x: frame.width * 0.11, y: frame.height * 0.52 },
            { x: planeX, y: planeY },
          ],
          curviness: desktop ? 0.9 : 0.7,
          autoRotate: 45,
          fromCurrent: false,
        },
        ...planeSize,
        duration,
        ease: 'power1.inOut',
      },
      field.leave,
    );
    timeline.to(
      flight,
      {
        backgroundColor: '#f8efdc',
        clipPath:
          'polygon(0% 60%,100% 0%,75% 75%,55% 60%,50% 100%,40% 80%,40% 65%,0% 60%)',
        duration: duration * 0.6,
        ease: 'power2.inOut',
      },
      field.leave + duration * 0.15,
    );
    timeline.to(
      flight.querySelector('.flight-label'),
      { opacity: 0, duration: duration * 0.2 },
      field.leave + duration * 0.1,
    );
    timeline.to(
      flight.querySelector('.flight-crease'),
      { opacity: 1, duration: duration * 0.3 },
      field.leave + duration * 0.45,
    );
    timeline.to(flight, { autoAlpha: 0, duration: aEntry * 0.04 }, flightEnd);

    const wayfinder = actor('sign');
    const menuEnd = food.start + mEntry * 0.18;
    const signPose = handoffPose(sign, menu);
    timeline.set(
      wayfinder,
      { ...signPose.from, rotationY: 0, rotationZ: -3, autoAlpha: 1 },
      airport.leave,
    );
    timeline.to(
      wayfinder,
      {
        ...signPose.to,
        rotationY: 180,
        rotationZ: -6,
        duration: menuEnd - airport.leave,
        ease: 'power2.inOut',
      },
      airport.leave,
    );
    timeline.to(
      wayfinder,
      { autoAlpha: 0, duration: mEntry * 0.06 },
      food.start + mEntry * 0.26,
    );

    const orbit = actor('orbit');
    const plateEnd = food.start + mEntry * 0.34;
    const orbitPose = handoffPose(trend, plate);
    timeline.set(orbit, { ...orbitPose.from, autoAlpha: 1 }, airport.leave);
    timeline.to(
      orbit,
      {
        ...orbitPose.to,
        duration: plateEnd - airport.leave,
        ease: 'power2.inOut',
      },
      airport.leave,
    );
    timeline.to(
      orbit.querySelector('path'),
      {
        attr: {
          d: 'M300 0C466 0 600 40 600 90C600 140 466 180 300 180C134 180 0 140 0 90C0 40 134 0 300 0',
        },
        stroke: '#cbb99a',
        duration: plateEnd - airport.leave,
        ease: 'power2.inOut',
      },
      airport.leave,
    );
    timeline.to(
      orbit,
      { autoAlpha: 0, duration: mEntry * 0.08 },
      food.start + mEntry * 0.46,
    );
    personalPaper(timeline);
  };
}
