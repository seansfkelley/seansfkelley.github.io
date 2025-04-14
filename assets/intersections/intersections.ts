// ASAP
document.querySelector("#no-javascript-alert")!.remove();
document.querySelector("#interactive")!.classList.remove("hidden");

type Point = [x: number, y: number];

const Point = {
  of: (x: number, y: number): Point => [x, y],
};

interface SvgRect {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

const SvgRect = {
  of: (x: number, y: number, width: number, height: number, rx?: number): SvgRect => ({
    type: "rect",
    x,
    y,
    width,
    height,
    rx,
  }),
};

interface SvgPath {
  type: "path";
  d: string;
}

const SvgPath = {
  of: (d: string): SvgPath => ({ type: "path", d }),
};

interface SvgLine {
  type: "line";
  a: Point;
  b: Point;
}

const SvgLine = {
  of: (a: Point, b: Point): SvgLine => ({ type: "line", a, b }),
};

type CrosswalkSignalTiming = [walk: number, warn: number, dontWalk: number];

interface Intersection {
  sidewalks: (SvgRect | SvgPath)[];
  crosswalks: (SvgLine | SvgPath)[];
  pedestrianSignals: {
    location: Point;
    timing: CrosswalkSignalTiming;
    timingOffset?: number;
  }[];
  trafficSignals: {
    location: Point;
  }[];
}

// viewbox = 0 0 17 25
const WALK_PATHS = [
  // head
  "m 10.29 3.54 a 1.73 1.73 0 1 1 1.71 -1.74 a 1.73 1.73 0 0 1 -1.73 1.73",
  // body
  "m 3 12 c 0.54 -1.38 0.85 -2.75 1.36 -4.32 l 2 -0.62 l -6.27 17.06 l 1.85 0.66 l 5 -10.14 l 2.66 4.59 l 0.51 5.73 l 2.18 -0.11 l -0.4 -6.75 l -2.89 -5.56 l 1.61 -3.92 c 0.58 0.43 1.14 1.07 1.76 1.51 l 3.77 2 l 0.8 -1.22 l -3.94 -2.81 l -3 -4.07 l -1.48 -0.61 l -6.11 3 l -1 5.54 z",
];

// viewbox = 0 0 27 41
const DONT_WALK_PATHS = [
  "m 2.452 40.784 c 0.375 -0.455 0.801 -0.948 0.845 -1.749 v -5.859 c 0 -2.551 -0.861 -2.984 -1.7 -3.766 c -1.389 -1.291 -1.18 -3.121 -1.103 -5.484 c 0.213 -6.552 0.46 -10.499 0.485 -16.62 c 0.003 -0.78 0.636 -1.417 1.417 -1.417 s 1.417 0.637 1.417 1.417 l 0.486 9.934 l 0.644 -0.016 c 0.102 -4.537 0.31 -9.115 0.31 -13.65 c 0 -0.779 0.636 -1.416 1.417 -1.416 c 0.779 0 1.415 0.637 1.415 1.416 c 0 0.013 0 0.028 0.005 0.041 l 0.195 13.622 h 0.656 c 0.184 -5.14 0.551 -10.394 0.551 -15.528 c 0 -0.78 0.637 -1.416 1.415 -1.416 c 0.781 0 1.418 0.636 1.418 1.416 v 0.018 l 0.305 15.51 h 0.859 c 0.049 -4.579 0.101 -9.158 0.151 -13.737 c 0.032 -0.75 0.662 -1.342 1.414 -1.342 c 0.764 0 1.401 0.614 1.417 1.383 l 0.7 18.266 c -0.006 0.338 0.296 0.59 0.633 0.59 c 0.192 0 0.628 -0.137 0.967 -0.656 l 3.202 -4.638 c 1.212 -1.702 2.829 -2.038 4.725 -1.321 c -1.175 2.209 -3.6 7.656 -6.06 10.716 c -1.297 2.028 -5.648 4.062 -5.648 6.672 v 5.342 c 0 1.099 1.084 2.341 1.036 2.274 l -13.574 -0.002 l 0 0 z",
];

const INTERSECTION = ((): Intersection => {
  const timing: CrosswalkSignalTiming = [5, 6, 13];
  const timingOffset = 12;

  const nw_s = Point.of(5, 10);
  const nw_e = Point.of(10, 5);
  const ne_s = Point.of(95, 10);
  const ne_w = Point.of(90, 5);
  const se_n = Point.of(95, 90);
  const se_w = Point.of(90, 95);
  const sw_n = Point.of(5, 90);
  const sw_e = Point.of(10, 95);

  return {
    sidewalks: [
      SvgRect.of(0, 0, 10, 10),
      SvgRect.of(90, 0, 10, 10),
      SvgRect.of(90, 90, 10, 10),
      SvgRect.of(0, 90, 10, 10),
    ],
    crosswalks: [
      SvgLine.of(nw_e, ne_w),
      SvgLine.of(ne_s, se_n),
      SvgLine.of(se_w, sw_e),
      SvgLine.of(sw_n, nw_s),
    ],
    pedestrianSignals: [
      { location: nw_e, timing },
      { location: ne_w, timing },
      { location: ne_s, timing, timingOffset },
      { location: se_n, timing, timingOffset },
      { location: se_w, timing },
      { location: sw_e, timing },
      { location: sw_n, timing, timingOffset },
      { location: nw_s, timing, timingOffset },
    ],
    trafficSignals: [],
  };
})();

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`assertion failure: ${message}`);
  }
}

function assertNever(nope: never): never {
  throw new Error("was not never");
}

function sum(numbers: number[]): number {
  assert(numbers.length > 0, "cannot sum nothing");
  return numbers.reduce((a, b) => a + b, 0);
}

function applySvgAttributes(
  element: SVGElement,
  attributes: Record<string, string | number | undefined>
): void {
  for (const [attribute, value] of Object.entries(attributes)) {
    if (value != null) {
      element.setAttribute(attribute, value.toString());
    }
  }
}

function applyClasses(
  element: SVGElement,
  classes: Record<string, string | number | boolean | undefined>
) {
  for (const [klass, condition] of Object.entries(classes)) {
    if (condition) {
      element.classList.add(klass);
    } else {
      element.classList.remove(klass);
    }
  }
}

function renderPedestrianSignal(
  [x, y]: Point,
  timing: CrosswalkSignalTiming,
  timingOffset: number | undefined
): SVGElement {
  const SIZE = 4;
  const BUFFER = 0.5;

  const outline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  applySvgAttributes(outline, {
    class: "outline",
    x,
    y,
    width: SIZE + 2 * BUFFER,
    height: SIZE + 2 * BUFFER,
    rx: 1,
  });

  const walk = document.createElementNS("http://www.w3.org/2000/svg", "use");
  applySvgAttributes(walk, {
    class: "walk",
    href: "#walk-symbol",
    x: x + BUFFER + SIZE / 2,
    y: y + BUFFER,
    width: SIZE / 2,
    height: SIZE,
  });

  const dontWalkSymbol = document.createElementNS("http://www.w3.org/2000/svg", "use");
  applySvgAttributes(dontWalkSymbol, {
    class: "symbol",
    href: "#dont-walk-symbol",
    x: x + BUFFER,
    y: y + BUFFER,
    width: SIZE / 2,
    height: SIZE,
  });

  const dontWalkText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  applySvgAttributes(dontWalkText, {
    class: "text",
    // CSS sets this to be middle-end anchored, so do the math relative to that point.
    x: x + BUFFER + SIZE,
    y: y + BUFFER + SIZE / 2,
  });

  const dontWalk = document.createElementNS("http://www.w3.org/2000/svg", "g");
  applySvgAttributes(dontWalk, { class: "dont-walk" });
  dontWalk.appendChild(dontWalkSymbol);
  dontWalk.appendChild(dontWalkText);

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  applySvgAttributes(g, {
    class: "pedestrian-signal",
    transform: `translate(-${BUFFER + SIZE / 2}, -${BUFFER + SIZE / 2})`,
    "data-walk": timing[0],
    "data-warning": timing[1],
    "data-dont-walk": timing[2],
    "data-offset": timingOffset,
  });

  g.appendChild(outline);
  g.appendChild(walk);
  g.appendChild(dontWalk);

  return g;
}

function renderTrafficSignal(): SVGElement {
  throw new Error("unimplemented");

  // <g id="traffic-signal" transform="translate(-2, -5)">
  //   <rect class="outline" x="0" y="0" width="4" height="10" rx="1" />
  //   <circle class="green" cx="2" cy="2" r="1.25" />
  //   <circle class="yellow" cx="2" cy="5" r="1.25" />
  //   <circle class="red" cx="2" cy="8" r="1.25" />
  // </g>
}

function renderIntersection(intersection: Intersection): {
  svg: SVGSVGElement;
  pedestrianSignals: SVGElement[];
  trafficSignals: SVGElement[];
  cycleTime: number | undefined;
} {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  let cycleTime: number | undefined = undefined;
  const renderedPedestrianSignals: SVGElement[] = [];
  const renderedTrafficSignals: SVGElement[] = [];

  function recordPedestrianSignal(e: SVGElement): SVGElement {
    renderedPedestrianSignals.push(e);
    return e;
  }

  function recordTrafficSignal(e: SVGElement): SVGElement {
    renderedTrafficSignals.push(e);
    return e;
  }

  applySvgAttributes(svg, {
    width: "400px",
    height: "400px",
    viewBox: "0 0 100 100",
  });

  const asphalt = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  applySvgAttributes(asphalt, {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    class: "asphalt",
  });
  svg.appendChild(asphalt);

  {
    const walkSymbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    applySvgAttributes(walkSymbol, {
      id: "walk-symbol",
      viewBox: "0 0 17 25",
    });
    for (const d of WALK_PATHS) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      applySvgAttributes(path, { d });
      walkSymbol.appendChild(path);
    }
    svg.append(walkSymbol);
  }

  {
    const dontWalkSymbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    applySvgAttributes(dontWalkSymbol, {
      id: "dont-walk-symbol",
      viewBox: "0 0 27 41",
    });
    for (const d of DONT_WALK_PATHS) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      applySvgAttributes(path, { d });
      dontWalkSymbol.appendChild(path);
    }
    svg.append(dontWalkSymbol);
  }

  function assertCycleTimeIsCompatible(timing: CrosswalkSignalTiming): void {
    const total = sum(timing);
    if (cycleTime == null) {
      cycleTime = total;
    }
    assert(total === cycleTime, "cycle time is not the same as already-defined timings");
  }

  for (const sidewalk of intersection.sidewalks) {
    if (sidewalk.type === "rect") {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

      const { type: _type, ...rest } = sidewalk;
      applySvgAttributes(rect, { ...rest, class: "sidewalk" });

      svg.appendChild(rect);
    } else if (sidewalk.type === "path") {
      throw new Error("unimplemented");
    } else {
      assertNever(sidewalk);
    }
  }

  for (const crosswalk of intersection.crosswalks) {
    if (crosswalk.type === "line") {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");

      const { type: _type, a, b } = crosswalk;

      applySvgAttributes(line, {
        class: "crosswalk",
        x1: a[0],
        y1: a[1],
        x2: b[0],
        y2: b[1],
      });

      svg.appendChild(line);
    } else if (crosswalk.type === "path") {
      throw new Error("unimplemented");
    } else {
      assertNever(crosswalk);
    }
  }

  for (const { location, timing, timingOffset } of intersection.pedestrianSignals) {
    assertCycleTimeIsCompatible(timing);

    svg.appendChild(recordPedestrianSignal(renderPedestrianSignal(location, timing, timingOffset)));
  }

  return {
    svg,
    pedestrianSignals: renderedPedestrianSignals,
    trafficSignals: renderedTrafficSignals,
    cycleTime,
  };
}

const container: SVGSVGElement = document.querySelector("#interactive")!;

const { svg, pedestrianSignals, trafficSignals, cycleTime } = renderIntersection(INTERSECTION);
container.appendChild(svg);

function tick(t: number, cycleTime: number) {
  for (const pedestrian of pedestrianSignals) {
    const effectiveT = (t + +(pedestrian.dataset.offset ?? "0")!) % cycleTime;
    assert(effectiveT >= 0, "effective t must be nonnegative");

    const walkDuration = +pedestrian.dataset.walk!;
    const warnDuration = +pedestrian.dataset.warning!;

    if (effectiveT < walkDuration) {
      applyClasses(pedestrian, {
        walk: true,
        "dont-walk": false,
        flashing: false,
      });
    } else if (effectiveT < walkDuration + warnDuration) {
      applyClasses(pedestrian, {
        walk: false,
        "dont-walk": true,
        flashing: true,
      });
      pedestrian.querySelector(".text")!.innerHTML = (
        walkDuration +
        warnDuration -
        effectiveT
      ).toString();
    } else {
      applyClasses(pedestrian, {
        walk: false,
        "dont-walk": true,
        flashing: false,
      });
    }
  }
}

let t = 0;
tick(t, cycleTime ?? 1);
if (cycleTime != null) {
  setInterval(() => {
    t = (t + 1) % cycleTime;
    tick(t, cycleTime);
  }, 1000);
}
