declare module 'canvas-confetti' {
  interface Options {
    particleCount?: number;
    spread?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
    startVelocity?: number;
    gravity?: number;
    ticks?: number;
    decay?: number;
    angle?: number;
    scalar?: number;
    drift?: number;
    shapes?: ('square' | 'circle')[];
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  function confetti(options?: Options): Promise<null>;

  export = confetti;
}
