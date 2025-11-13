import type { Coordinate, CoverageBlueprint } from "./types";

export type RouteLibrary = Record<string, Coordinate[]>;

export const offensiveRoutes: RouteLibrary = {
  Go: [
    { x: 0, y: -160 },
  ],
  Slant: [
    { x: 20, y: -40 },
    { x: 80, y: -120 },
  ],
  Post: [
    { x: 20, y: -60 },
    { x: 80, y: -180 },
  ],
  Corner: [
    { x: 0, y: -60 },
    { x: 100, y: -160 },
  ],
  Out: [
    { x: 0, y: -40 },
    { x: 80, y: -40 },
  ],
  In: [
    { x: 0, y: -40 },
    { x: -80, y: -40 },
  ],
  Wheel: [
    { x: -40, y: -40 },
    { x: -60, y: -80 },
    { x: -20, y: -160 },
  ],
  Curl: [
    { x: 0, y: -60 },
    { x: 0, y: -20 },
  ],
  Drag: [
    { x: 80, y: -20 },
  ],
  Screen: [
    { x: -20, y: 0 },
    { x: -40, y: -10 },
  ],
  Block: [],
};

export const defensiveCoverages: Record<string, { label: string; description: string; blueprint: CoverageBlueprint }> = {
  cover2: {
    label: "Cover 2 Zone",
    description: "Profundidad dividida entre los safeties y zonas planas para los corners.",
    blueprint: {
      cb1: [
        { x: 0, y: -40 },
        { x: -40, y: -80 },
      ],
      cb2: [
        { x: 0, y: -40 },
        { x: 40, y: -80 },
      ],
      fs: [
        { x: -40, y: -160 },
      ],
      ss: [
        { x: 40, y: -160 },
      ],
      sam: [{ x: -20, y: -80 }],
      mike: [{ x: 0, y: -80 }],
      will: [{ x: 20, y: -80 }],
    },
  },
  cover3: {
    label: "Cover 3 Drop",
    description: "Tres profundos y cuatro zonas cortas.",
    blueprint: {
      cb1: [
        { x: -40, y: -160 },
      ],
      cb2: [
        { x: 40, y: -160 },
      ],
      fs: [{ x: 0, y: -180 }],
      ss: [{ x: 0, y: -120 }],
      sam: [{ x: -60, y: -60 }],
      mike: [{ x: 0, y: -60 }],
      will: [{ x: 60, y: -60 }],
    },
  },
  man: {
    label: "Man to Man",
    description: "Coberturas individuales con apoyo profundo del safety.",
    blueprint: {
      cb1: [{ x: -20, y: -120 }],
      cb2: [{ x: 20, y: -120 }],
      fs: [{ x: 0, y: -180 }],
      ss: [{ x: 0, y: -120 }],
      sam: [{ x: -20, y: -40 }],
      mike: [{ x: 0, y: -40 }],
      will: [{ x: 20, y: -40 }],
    },
  },
  blitz: {
    label: "Pressure Blitz",
    description: "Envío extra de rushers dejando cobertura hombre a hombre.",
    blueprint: {
      le: [{ x: 0, y: -60 }],
      re: [{ x: 0, y: -60 }],
      dt1: [{ x: 0, y: -60 }],
      dt2: [{ x: 0, y: -60 }],
      sam: [{ x: 0, y: -40 }],
      will: [{ x: 0, y: -40 }],
      mike: [{ x: 0, y: -40 }],
      cb1: [{ x: -40, y: -120 }],
      cb2: [{ x: 40, y: -120 }],
      fs: [{ x: 0, y: -160 }],
      ss: [{ x: 0, y: -120 }],
    },
  },
  flagZone: {
    label: "Flag Zone Mix",
    description: "Cobertura híbrida pensada para Flag 5vs5.",
    blueprint: {
      r1: [{ x: 0, y: -80 }],
      r2: [{ x: 0, y: -80 }],
      lb: [{ x: 0, y: -100 }],
      cb1: [{ x: -60, y: -120 }],
      cb2: [{ x: 60, y: -120 }],
    },
  },
};
