import { storyScenes } from './story-data';
import type { Timeline } from './stages/types';
import { scaledPaperPose, type PaperBox } from './paper-pose';

export function preparePersonalPaper(
  stage: HTMLElement,
  measure: (selector: string) => PaperBox,
  desktop: boolean,
): (timeline: Timeline) => void {
  const ribbon = stage.querySelector('[data-shared-receipt]');
  if (!ribbon) return () => {};
  const frame = stage.getBoundingClientRect();
  const receipt = measure('[data-order-receipt]');
  const envelope = measure('.envelope-art');
  // The stage pins at viewport top, where the fixed header and footer are measured.
  // A deep link may have scrolled the stage before it is pinned.
  const headerBottom = document
    .querySelector('.site-header')!
    .getBoundingClientRect().bottom;
  const footerTop = document
    .querySelector('.reading-indicator')!
    .getBoundingClientRect().top;
  const narrow = frame.width < 768;
  const short = !narrow && frame.height < 580;
  const x = frame.width * (narrow ? 0.03 : 0.055);
  const y = headerBottom + (narrow ? 12 : short ? 10 : 16);
  const paper = {
    x,
    y,
    width: frame.width - x * 2,
    height: Math.max(1, footerTop - y - (narrow ? 12 : short ? 8 : 16)),
  };
  const foldedPaper = {
    x: envelope.x - envelope.width * 0.45,
    y: envelope.y + envelope.height * 0.07,
    width: envelope.width * 1.9,
    height: envelope.height * 0.92,
  };
  const boxPose = (box: PaperBox) =>
    desktop ? box : scaledPaperPose(box, paper, 0);
  const initialPaper = desktop
    ? receipt
    : {
        width: paper.width,
        height: paper.height,
        ...scaledPaperPose(receipt, paper, 0),
      };
  const printedNote = ribbon.querySelector('.ribbon-print');
  const food = storyScenes.find((s) => s.id === 'project-mcdonalds')!;
  const about = storyScenes.find((s) => s.id === 'about')!;
  const journey = storyScenes.find((s) => s.id === 'journey')!;
  const contact = storyScenes.find((s) => s.id === 'contact')!;
  const entry = food.read - food.start;
  const receiptStart = food.start + entry * 0.75;
  const receiptEdge =
    'polygon(0% 0%,100% 0%,100% 94%,91% 100%,82% 94%,73% 100%,64% 94%,55% 100%,46% 94%,37% 100%,28% 94%,19% 100%,10% 94%,0% 100%)';
  const paperEdge =
    'polygon(0% 0%,100% 0%,100% 99%,91% 100%,82% 99%,73% 99.8%,64% 99.2%,55% 100%,46% 99%,37% 99.7%,28% 99%,19% 100%,10% 99.2%,0% 100%)';
  return (timeline) => {
    timeline.set(
      ribbon,
      {
        ...initialPaper,
        scaleY: 0,
        rotationZ: 5,
        autoAlpha: 1,
        clipPath: receiptEdge,
        transformOrigin: 'center top',
      },
      receiptStart,
    );
    if (!desktop) {
      // The note keeps its original type size while the paper is receipt-sized.
      timeline.set(
        printedNote,
        {
          width: receipt.width,
          height: receipt.height,
          scaleX: paper.width / Math.max(receipt.width, 1),
          scaleY: paper.height / Math.max(receipt.height, 1),
          transformOrigin: 'left top',
        },
        receiptStart,
      );
    }
    timeline.to(
      ribbon,
      {
        scaleY: desktop ? 1 : receipt.height / paper.height,
        duration: entry * 0.2,
        ease: 'power2.out',
      },
      receiptStart,
    );
    timeline.fromTo(
      ribbon.querySelectorAll('.ribbon-ink span'),
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: entry * 0.08,
        stagger: entry * 0.02,
        ease: 'none',
      },
      food.start + entry * 0.86,
    );
    timeline.to(printedNote, { opacity: 0, duration: 0.6 }, food.leave);
    timeline.to(
      ribbon,
      {
        ...boxPose(paper),
        rotationZ: -0.7,
        clipPath: paperEdge,
        duration: about.start - food.leave,
        ease: 'power2.inOut',
      },
      food.leave,
    );
    timeline.to(
      ribbon,
      {
        rotationZ: 0.4,
        duration: journey.start - about.leave,
        ease: 'power2.inOut',
      },
      about.leave,
    );
    timeline.fromTo(
      ribbon.querySelector('.ribbon-left'),
      { rotationY: 0 },
      { rotationY: 162, duration: 1.15, ease: 'power2.inOut' },
      journey.leave,
    );
    timeline.fromTo(
      ribbon.querySelector('.ribbon-right'),
      { rotationY: 0 },
      { rotationY: -162, duration: 1.15, ease: 'power2.inOut' },
      journey.leave + 0.13,
    );
    const foldedAt = contact.start + (contact.read - contact.start) * 0.35;
    timeline.to(
      ribbon,
      {
        ...boxPose(foldedPaper),
        rotationX: 38,
        rotationZ: -5,
        duration: foldedAt - journey.leave,
        ease: 'power2.inOut',
      },
      journey.leave,
    );
    timeline.fromTo(
      ribbon.querySelector('.ribbon-flap'),
      { rotationX: 0, opacity: 0 },
      { rotationX: 156, opacity: 1, duration: 0.8, ease: 'power2.inOut' },
      contact.start,
    );
    timeline.to(ribbon, { autoAlpha: 0, duration: 0.25 }, foldedAt - 0.25);
  };
}
