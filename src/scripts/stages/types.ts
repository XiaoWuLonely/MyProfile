import type { gsap as animationEngine } from 'gsap';
export type Timeline = ReturnType<typeof animationEngine.timeline>;
export interface Scene {
  id: string;
  start: number;
  read: number;
  leave: number;
  end: number;
}
