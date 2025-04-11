type Point = [x: number, y: number];

interface SvgRect {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  rx?: number;
}

interface SvgPath {
  type: "path";
  d: string[];
}

interface Sidewalk {
  shape: SvgRect | SvgPath;
  connections: Record<string, Point>;
}

type QualifiedSidewalkConnectionId = `${string}.${string}`;

type CrosswalkSignalTiming = [walk: number, warn: number, dontWalk: number];

interface SimpleCrosswalk {
  type: "simple";
  timing: CrosswalkSignalTiming;
  timingOffset?: number;
  a: QualifiedSidewalkConnectionId;
  b: QualifiedSidewalkConnectionId;
}

interface ComplexCrosswalk {
  type: "complex";
  connections: QualifiedSidewalkConnectionId[];
  shape: SvgPath;
}

interface Intersection {
  sidewalks: Record<string, Sidewalk>;
  crosswalks: (SimpleCrosswalk | ComplexCrosswalk)[];
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  rx?: number
): SvgRect {
  return { type: "rect", x, y, width, height, rx };
}

const INTERSECTION = ((): Intersection => {
  const timing: CrosswalkSignalTiming = [5, 2, 3];

  return {
    sidewalks: {
      nw: {
        shape: rect(0, 0, 10, 10),
        connections: {
          s: [5, 10],
          e: [10, 5],
        },
      },
      ne: {
        shape: rect(90, 0, 10, 10),
        connections: {
          s: [95, 10],
          w: [90, 5],
        },
      },
      se: {
        shape: rect(90, 90, 10, 10),
        connections: {
          n: [95, 90],
          w: [90, 95],
        },
      },
      sw: {
        shape: rect(0, 90, 10, 10),
        connections: {
          n: [5, 90],
          e: [10, 95],
        },
      },
    },
    crosswalks: [
      {
        type: "simple",
        timing,
        a: "nw.e",
        b: "ne.w",
      },
      {
        type: "simple",
        timing,
        timingOffset: 5,
        a: "ne.s",
        b: "se.n",
      },
      {
        type: "simple",
        timing,
        a: "se.w",
        b: "sw.e",
      },
      {
        type: "simple",
        timingOffset: 5,
        timing,
        a: "sw.n",
        b: "nw.s",
      },
    ],
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

function renderPedestrianSignal(
  [x, y]: Point,
  timing: CrosswalkSignalTiming,
  timingOffset: number | undefined
): SVGElement {
  const outline = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  applySvgAttributes(outline, {
    class: "outline",
    x,
    y,
    width: 5,
    height: 5,
    rx: 1,
  });

  const walk = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  applySvgAttributes(walk, {
    class: "walk",
    x: x + 1,
    y: y + 1,
    width: 3,
    height: 3,
  });

  const dontWalk = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  applySvgAttributes(dontWalk, {
    class: "dont-walk",
    x: x + 1,
    y: y + 1,
    width: 3,
    height: 3,
  });

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  applySvgAttributes(g, {
    class: "pedestrian-signal",
    transform: "translate(-2.5, -2.5)",
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

function renderIntersection({
  sidewalks,
  crosswalks,
}: Intersection): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  applySvgAttributes(svg, {
    width: "400px",
    height: "400px",
    viewBox: "0 0 100 100",
  });

  const asphalt = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "rect"
  );
  applySvgAttributes(asphalt, {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    class: "asphalt",
  });
  svg.appendChild(asphalt);

  const availableConnections = new Set<string>();

  let totalCycleDuration: number | undefined = undefined;
  function assertCycleTimeIsCompatible(timing: CrosswalkSignalTiming) {
    const total = sum(timing);
    if (totalCycleDuration == null) {
      totalCycleDuration = total;
    }
    assert(
      total === totalCycleDuration,
      "cycle time is not the same as already-defined timings"
    );
  }

  for (const [id, { shape, connections }] of Object.entries(sidewalks)) {
    for (const connectionId of Object.keys(connections)) {
      availableConnections.add(`${id}.${connectionId}`);
    }

    if (shape.type === "rect") {
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );

      const { type, ...rest } = shape;
      rect.id = id;
      applySvgAttributes(rect, { ...rest, class: "sidewalk" });

      svg.appendChild(rect);
    } else if (shape.type === "path") {
      throw new Error("unimplemented");
    } else {
      assertNever(shape);
    }
  }

  for (const crosswalk of crosswalks) {
    if (crosswalk.type === "simple") {
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

      const { type, a, b, timing, timingOffset } = crosswalk;
      line.id = `${a}-${b}`;

      assert(
        availableConnections.has(a),
        `cannot reuse qualified connection ID "${a}" for a-side`
      );
      availableConnections.delete(a);
      assert(
        availableConnections.has(b),
        `cannot reuse qualified connection ID "${b}" for b-side`
      );
      availableConnections.delete(b);

      const [aSidewalkId, aConnectionId] = a.split(".", 2);
      const aConnection = sidewalks[aSidewalkId]?.connections[aConnectionId];
      assert(aConnection != null, "a-side connection cannot be null");
      const [bSidewalkId, bConnectionId] = b.split(".", 2);
      const bConnection = sidewalks[bSidewalkId]?.connections[bConnectionId];
      assert(bConnection != null, "b-side connection cannot be null");

      assertCycleTimeIsCompatible(timing);

      applySvgAttributes(line, {
        class: "crosswalk",
        x1: aConnection[0],
        y1: aConnection[1],
        x2: bConnection[0],
        y2: bConnection[1],
      });

      svg.appendChild(line);
      svg.appendChild(
        renderPedestrianSignal(aConnection, timing, timingOffset)
      );
      svg.appendChild(
        renderPedestrianSignal(bConnection, timing, timingOffset)
      );
    } else if (crosswalk.type === "complex") {
      throw new Error("unimplemented");
    } else {
      assertNever(crosswalk);
    }
  }

  return svg;
}

document.body.appendChild(renderIntersection(INTERSECTION));
