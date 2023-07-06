// TODO
// - finish ParametricLocators for `on`
// - do something like ParametricLocators but for `surround`
// - canton
// - posture -- for things like swords, requires resizing
// - push elements around when quartering
// - party per field can also have complex content in it
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, castle, and all their variants
// - decorations for lines (e.g. embattled, engrailed, etc.)

declare namespace PeggyParser {
  interface SyntaxError extends Error {
    expected: any;
    found: any;
    location: any;
  }
}

declare const parser: {
  parse: (text: string) => ComplexContent;
};

declare interface Node {
  cloneNode<T extends Node>(this: T, deep?: boolean): T;
}

type Count = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Tincture = string & { __tincture: unknown };
type VariedName = string & { __varied: unknown };
type Posture = "palewise" | "fesswise" | "bendwise" | "saltirewise";
type Direction = "pale" | "fess" | "bend" | "chevron" | "saltire";
type Quarter = 1 | 2 | 3 | 4;

interface Transform {
  x: number;
  y: number;
  scale?: number;
}

const Transform = {
  of: (x: number, y: number, scale?: number): Transform => ({ x, y, scale }),
  apply: (
    { x, y, scale }: Transform,
    element: SVGElement,
    { posture }: { posture?: Posture | null | undefined } = {}
  ): void => {
    const rotate = (() => {
      switch (posture) {
        case null:
        case undefined:
        case "palewise":
          return undefined;
        case "fesswise":
          return "rotate(90)";
        case "bendwise":
          return "rotate(45)";
        case "saltirewise":
          return "rotate(45)"; // TODO
        default:
          assertNever(posture);
      }
    })();

    const transform = [
      `translate(${x}, ${y})`,
      scale != null && scale !== 1 ? `scale(${scale})` : undefined,
      rotate,
    ]
      .filter(Boolean)
      .join(" ");
    element.setAttribute("transform", transform);
  },
};

function applyTransforms(
  element: SVGElement,
  {
    translate,
    scale,
    rotate,
  }: { translate?: Coordinate; scale?: number; rotate?: Posture } = {}
): void {
  function getRotation(posture: Posture) {
    switch (posture) {
      case null:
      case undefined:
      case "palewise":
        return undefined;
      case "fesswise":
        return "rotate(90)";
      case "bendwise":
        return "rotate(45)";
      case "saltirewise":
        return "rotate(45)"; // TODO
      default:
        assertNever(posture);
    }
  }

  const transform = [
    translate != null
      ? `translate(${translate[0]}, ${translate[1]})`
      : undefined,
    scale != null && scale !== 1 ? `scale(${scale})` : undefined,
    rotate != null ? getRotation(rotate) : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  element.setAttribute("transform", transform);
}

type Coordinate = [x: number, y: number];

interface ParametricLocator {
  evaluate(index: number, total: number): Coordinate;
}

class ParametricPoint implements ParametricLocator {
  public constructor(private point: Coordinate) {}

  public evaluate(index: number, total: number): Coordinate {
    assert(index <= total, "index must be less than total");
    return this.point;
  }
}

class ParametricMultiPoint implements ParametricLocator {
  public constructor(private points: Coordinate[]) {}

  public evaluate(index: number, total: number): Coordinate {
    assert(index <= total, "index must be less than total");
    assert(
      index <= this.points.length,
      "index must be less than the number of points"
    );
    return this.points[index];
  }
}

class ParametricLine implements ParametricLocator {
  public constructor(private src: Coordinate, private dst: Coordinate) {}

  public evaluate(index: number, total: number): Coordinate {
    assert(index <= total, "index must be less than total");
    const t = index / total;

    return [
      (this.dst[0] - this.src[0]) * t + this.src[0],
      (this.dst[1] - this.src[1]) * t + this.src[1],
    ];
  }
}

interface Segment {
  src: Coordinate;
  dst: Coordinate;
  highLimit: number;
}

class ParametricPolyline implements ParametricLocator {
  private segments: Segment[];

  public constructor(...segments: Segment[]) {
    assert(segments.length > 0, "must have at least one segment");
    assert(segments.at(-1)!.highLimit === 1, "last segment must end at 1");
    this.segments = segments;
  }

  public evaluate(index: number, total: number): Coordinate {
    assert(index <= total, "index must be less than total");
    const t = index / total;

    let lowLimit = 0;
    for (const s of this.segments) {
      if (t < s.highLimit) {
        const fraction = (t - lowLimit) / (s.highLimit - lowLimit);
        return [
          (s.dst[0] - s.src[0]) * fraction + s.src[0],
          (s.dst[1] - s.src[1]) * fraction + s.src[1],
        ];
      } else {
        lowLimit = s.highLimit;
      }
    }

    throw new Error("should be unreachable");
  }
}

type ComplexContent = SimpleField | PartyPerField | Quarterly;
type SimpleContent = Ordinary | Charge | On;

type SimpleField =
  | {
      tincture: Tincture;
      content?: SimpleContent | null;
    }
  | {
      varied: Varied;
      first: Tincture;
      second: Tincture;
      content?: SimpleContent | null;
    };

interface Varied {
  type: VariedName;
  count?: number | null;
}

interface PartyPerField {
  direction: Direction;
  first: Tincture;
  second: Tincture;
  content?: SimpleContent | null;
}

interface Quarterly {
  quarters: Quartering[];
}

interface Quartering {
  quarters: Quarter[];
  content: ComplexContent;
}

interface Ordinary {
  ordinary: string;
  tincture: Tincture;
}

interface Charge {
  charge: string;
  tincture: Tincture;
  count: Count;
  posture?: Posture | null;
  direction?: Direction | null;
}

interface On {
  on: true;
  ordinary: Ordinary;
  surround?: Charge | null;
  charge: Charge;
}

interface OrdinaryRenderer {
  (tincture: Tincture): SVGElement;
  // If undefined, render nothing for the scale. It's too silly.
  on: Record<
    Count,
    | {
        locator: ParametricLocator;
        scale: number;
      }
    | undefined
  >;
  surround: Record<number, Transform[]>;
}

interface ChargeRenderer {
  (tincture: Tincture): SVGElement;
}

interface VariedClipPathGenerator {
  (count?: number): string;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`assertion failure: ${message}`);
  }
}

function assertNever(nope: never): never {
  throw new Error("was not never");
}

// TODO: Factor this out to the top so _everything_ is a function of it.
const H = 120;
const H_2 = H / 2;
const W = 100;
const W_2 = W / 2;

// This one is pointier, but looks weirder with some bends:
// "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z";
const FIELD_PATH = path`
  M -${W_2} -${H_2}
  L  ${W_2} -${H_2}
  L  ${W_2}  ${H_2 / 3}
  C  ${W_2}           ${H_2 * (2 / 3)}
     ${W_2 * (3 / 5)} ${H_2 * (5 / 6)}
     0                ${H_2}
  C -${W_2 * (3 / 5)} ${H_2 * (5 / 6)}
     ${-W_2}          ${H_2 * (2 / 3)}
     ${-W_2}          ${H_2 / 3}
  Z
`;

function path(strings: TemplateStringsArray, ...values: number[]): string {
  const parts = [];
  for (let i = 0; i < values.length; ++i) {
    parts.push(strings[i], values[i]);
  }
  parts.push(strings.at(-1));
  return parts.join("").trim().replaceAll("\n", "").replaceAll(/ +/g, " ");
}

const COUNTERCHANGED = "counterchanged";

function parseAndRenderBlazon(text: string) {
  let result;
  try {
    result = parser.parse(text.trim().toLowerCase());
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = (e as PeggyParser.SyntaxError).toString();
    error.style.display = "block";
    console.error("start", (e as PeggyParser.SyntaxError).location?.start);
    console.error("end", (e as PeggyParser.SyntaxError).location?.end);
    console.error("expected", (e as PeggyParser.SyntaxError).expected);
    return;
  }

  console.log(result);

  rendered.innerHTML = "";
  const outline = svg.path(FIELD_PATH, "none");
  outline.classList.add("outline");
  rendered.appendChild(outline);

  // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
  const container = svg.g();
  container.style.clipPath = `path("${FIELD_PATH}")`;
  rendered.appendChild(container);
  // Make sure there's always a default background.
  container.appendChild(field("argent" as Tincture));

  complexContent(container, result);
}

function field(tincture: Tincture) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", `-${W_2}`);
  rect.setAttribute("y", `-${H_2}`);
  rect.setAttribute("width", `${W}`);
  rect.setAttribute("height", `${H}`);
  rect.classList.add(`fill-${tincture}`);
  return rect;
}

const PARTY_PER_CLIP_PATHS: Record<Direction, string[]> = {
  pale: [
    'path("M -50 -60 L 0 -60 L 0 60 L -50 60 Z")',
    'path("M 0 -60 L 0 60 L 50 60 L 50 -60 Z")',
  ],
  fess: [
    'path("M -50 -60 L -50 0 L 50 0 L 50 -60 Z")',
    'path("M -50 60 L -50 0 L 50 0 L 50 60 Z")',
  ],
};

// ----------------------------------------------------------------------------
// UTIL
// ----------------------------------------------------------------------------

const svg = {
  path: (d: string, fill: Tincture | "none"): SVGPathElement => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.classList.add(`fill-${fill}`);
    return path;
  },
  g: (): SVGGElement => {
    return document.createElementNS("http://www.w3.org/2000/svg", "g");
  },
};

// ----------------------------------------------------------------------------
// ORDINARIES
// ----------------------------------------------------------------------------

function bend(tincture: Tincture) {
  return svg.path(
    path`
      M -59 -51
      L  41  63
      L  59  45
      L -41 -69
      Z
    `,
    tincture
  );
}

bend.on = {
  1: [
    Transform.of(0, -3, 0.4), //
  ],
  2: [
    Transform.of(-15, -20, 0.4), //
    Transform.of(15, 14, 0.4),
  ],
  3: [
    Transform.of(-25, -32, 0.4), //
    Transform.of(0, -3, 0.4),
    Transform.of(24, 24, 0.4),
  ],
  4: [
    Transform.of(-31, -38, 0.4), //
    Transform.of(-10, -14, 0.4),
    Transform.of(10, 8, 0.4),
    Transform.of(29, 29, 0.4),
  ],
} satisfies OrdinaryRenderer["on"];

function chief(tincture: Tincture) {
  return svg.path(
    path`
      M -50 -60
      L -50 -20
      L  50 -20
      L  50 -60
      Z
    `,
    tincture
  );
}

function chevron(tincture: Tincture) {
  return svg.path(
    path`
      M  0 -22
      L 55  33
      L 43  45
      L  0   2
      L -43 45
      L -55 33
      Z
    `,
    tincture
  );
}

function cross(tincture: Tincture) {
  return svg.path(
    path`
      M -10 -60
      L  10 -60
      L  10 -24
      L  50 -24
      L  50  -4
      L  10  -4
      L  10  60
      L -10  60
      L -10  -4
      L -50  -4
      L -50 -24
      L -10 -24
      Z
    `,
    tincture
  );
}

const CROSS_LOCATOR = new ParametricMultiPoint([
  [-30, -14],
  [30, -14],
  [0, -44],
  [0, 16],
  [0, -14],
]);

cross.on = {
  1: {
    locator: new ParametricPoint([0, -14]),
    scale: 0.4,
  },
  2: {
    locator: CROSS_LOCATOR,
    scale: 0.4,
  },
  3: {
    locator: CROSS_LOCATOR,
    scale: 0.4,
  },
  4: {
    locator: CROSS_LOCATOR,
    scale: 0.4,
  },
  5: {
    locator: CROSS_LOCATOR,
    scale: 0.4,
  },
  6: undefined,
  7: undefined,
  8: undefined,
  9: undefined,
  10: undefined,
  11: undefined,
  12: undefined,
} satisfies OrdinaryRenderer["on"];

function fess(tincture: Tincture) {
  return svg.path(
    path`
      M -50 -25
      L  50 -25
      L  50  15
      L -50  15
      Z
    `,
    tincture
  );
}

fess.on = {
  1: {
    locator: new ParametricPoint([0, -4]),
    scale: 0.6,
  },
  2: {
    locator: new ParametricLine([-W_2 * 0.4, -4], [W_2 * 0.4, -4]),
    scale: 0.6,
  },
  3: {
    locator: new ParametricLine([-W_2 * 0.6, -4], [W_2 * 0.6, -4]),
    scale: 0.5,
  },
  4: {
    locator: new ParametricLine([-W_2 * 0.7, -4], [W_2 * 0.7, -4]),
    scale: 0.4,
  },
  5: {
    locator: new ParametricLine([-W_2 * 0.7, -4], [W_2 * 0.7, -4]),
    scale: 0.3,
  },
  6: {
    locator: new ParametricLine([-W_2 * 0.7, -4], [W_2 * 0.7, -4]),
    scale: 0.25,
  },
  7: {
    locator: new ParametricLine([-W_2 * 0.7, -4], [W_2 * 0.7, -4]),
    scale: 0.2,
  },
  8: {
    locator: new ParametricLine([-W_2 * 0.7, -4], [W_2 * 0.7, -4]),
    scale: 0.18,
  },
  9: undefined,
  10: undefined,
  11: undefined,
  12: undefined,
} satisfies OrdinaryRenderer["on"];

fess.surround = {
  2: [
    Transform.of(0, -42, 0.6), //
    Transform.of(0, 35, 0.6),
  ],
  3: [
    Transform.of(-25, -42, 0.6), //
    Transform.of(25, -42, 0.6),
    Transform.of(0, 35, 0.6),
  ],
  4: [
    Transform.of(-25, -42, 0.6), //
    Transform.of(25, -42, 0.6),
    Transform.of(-15, 35, 0.5),
    Transform.of(15, 35, 0.5),
  ],
} satisfies OrdinaryRenderer["surround"];

function pale(tincture: Tincture) {
  return svg.path(
    path`
      M -15 -60
      L  15 -60
      L  15  60
      L -15  60
      Z
    `,
    tincture
  );
}

function saltire(tincture: Tincture) {
  return svg.path(
    path`
      M  44 -66
      L  56 -54
      L  12 -10
      L  55  33
      L  43  45
      L   0   2
      L -43  45
      L -55  33
      L -12 -10
      L -56 -54
      L -44 -66
      L  0  -22
      Z
    `,
    tincture
  );
}

const ORDINARIES: Record<string, OrdinaryRenderer> = {
  bend,
  chevron,
  chief,
  cross,
  fess,
  pale,
  saltire,
};

// ----------------------------------------------------------------------------
// CHARGES
// ----------------------------------------------------------------------------

function sword(tincture: Tincture) {
  return svg.path(
    "M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z",
    tincture
  );
}

function rondel(tincture: Tincture) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("r", "20");
  circle.setAttribute("cx", "0");
  circle.setAttribute("cy", "0");
  circle.classList.add(`fill-${tincture}`);
  return circle;
}

function mullet(tincture: Tincture) {
  return svg.path(
    "M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z",
    tincture
  );
}

const CHARGE_DIRECTIONS: Record<
  Direction | "none",
  Record<number, Transform[]>
> = {
  none: {
    1: [
      Transform.of(0, -5), //
    ],
    2: [
      Transform.of(-20, -5, 0.75), //
      Transform.of(20, -5, 0.75),
    ],
    3: [
      Transform.of(0, -23, 0.75), //
      Transform.of(-20, 7, 0.75),
      Transform.of(20, 7, 0.75),
    ],
  },
  fess: {
    1: [
      Transform.of(0, -5), //
    ],
    2: [
      Transform.of(-20, -5, 0.75), //
      Transform.of(20, -5, 0.75),
    ],
    3: [
      Transform.of(-30, -5, 0.5), //
      Transform.of(0, -5, 0.5),
      Transform.of(30, -5, 0.5),
    ],
    4: [
      Transform.of(-33, -5, 0.4), //
      Transform.of(-11, -5, 0.4),
      Transform.of(11, -5, 0.4),
      Transform.of(33, -5, 0.4),
    ],
  },
};

const CHARGES: Record<string, ChargeRenderer> = {
  sword,
  rondel,
  mullet,
};

// ----------------------------------------------------------------------------
// VARIED
// ----------------------------------------------------------------------------

function barry(count: number = 6) {
  const step = H / count;
  let d = "";
  for (let y = 1; y < count; y += 2) {
    d += path`
      M -${W_2} ${-H_2 + y * step}
      L  ${W_2} ${-H_2 + y * step}
      L  ${W_2} ${-H_2 + y * step + step}
      L -${W_2} ${-H_2 + y * step + step}
      Z
    `;
  }
  return d;
}

function barryBendy(count: number = 8) {
  count *= 2; // Looks better, and feels easier to specify the desired value, with higher counts.
  const step = (W / count) * 2;
  let d = "";
  for (let y = 0; y < (H / W) * count; y++) {
    for (let x = y % 2; x < count; x += 2) {
      const offset = (1 / 2) * y;
      d += path`
        M  ${W_2 - (x - offset) * step}         ${-H_2 + y * step}
        L  ${W_2 - (x + 1 - offset) * step}     ${-H_2 + y * step}
        L  ${W_2 - (x + 1 / 2 - offset) * step} ${-H_2 + (y + 1) * step}
        L  ${W_2 - (x - 1 / 2 - offset) * step} ${-H_2 + (y + 1) * step}
        Z
      `;
    }
  }
  return d;
}

function bendy(count: number = 8) {
  const step = (W / count) * 2;
  let d = "";
  // This is a bit wasteful, as it generates a clipping path considerably larger than the w * h area...
  for (let i = 1; i < count * 2; i += 2) {
    d += path`
      M  ${W_2 - i * step}       ${-H_2}
      L  ${W_2 - (i + 1) * step} ${-H_2}
      L  ${W_2}                  ${-H_2 + (i + 1) * step}
      L  ${W_2}                  ${-H_2 + i * step}
      Z
    `;
  }
  return d;
}

function checky(count: number = 8) {
  // w < h, so we use that to determine step (also it's more intuitive)
  const step = W / count;
  let d = "";
  for (let x = 0; x < count; ++x) {
    for (let y = x % 2; y < (H / W) * count; y += 2) {
      d += path`
        M ${-W_2 + x * step}        ${-H_2 + y * step}
        L ${-W_2 + x * step}        ${-H_2 + y * step + step}
        L ${-W_2 + x * step + step} ${-H_2 + y * step + step}
        L ${-W_2 + x * step + step} ${-H_2 + y * step}
        Z
      `;
    }
  }
  return d;
}

function chevronny(count: number) {
  throw new Error("unimplemented");
}

function lozengy(count: number) {
  throw new Error("unimplemented");
}

function paly(count: number = 6) {
  const step = W / count;
  let d = "";
  for (let x = 1; x < count; x += 2) {
    d += path`
      M ${-W_2 + x * step}        -${H_2}
      L ${-W_2 + x * step}         ${H_2}
      L ${-W_2 + x * step + step}  ${H_2}
      L ${-W_2 + x * step + step} -${H_2}
      Z`;
  }
  return d;
}

const VARIED: Record<string, VariedClipPathGenerator> = {
  barry,
  "barry bendy": barryBendy,
  bendy,
  checky,
  chevronny,
  lozengy,
  paly,
};

// ----------------------------------------------------------------------------
// HIGHER-ORDER
// ----------------------------------------------------------------------------

function complexContent(container: SVGElement, content: ComplexContent) {
  function renderIntoParent(
    parent: SVGElement,
    element: Ordinary | Charge | On
  ) {
    if ("on" in element) {
      on(parent, element);
    } else if ("ordinary" in element) {
      parent.appendChild(ORDINARIES[element.ordinary](element.tincture));
    } else if ("charge" in element) {
      for (const transform of CHARGE_DIRECTIONS[element.direction ?? "none"][
        element.count
      ] ?? []) {
        const rendered = CHARGES[element.charge](element.tincture);
        Transform.apply(transform, rendered, element);
        parent.appendChild(rendered);
      }
    } else {
      assertNever(element);
    }
  }

  function overwriteCounterchangedTincture(
    element: Ordinary | Charge | On,
    tincture: Tincture
  ) {
    if ("on" in element) {
      return {
        ...element,
        // Note that we do NOT overwrite the `charge` tincture. That's a function of the `on`, not the field.
        surround: element.surround
          ? {
              ...element.surround,
              tincture,
            }
          : undefined,
      };
    } else if ("ordinary" in element) {
      return { ...element, tincture };
    } else if ("charge" in element) {
      return { ...element, tincture };
    } else {
      assertNever(element);
    }
  }

  if ("direction" in content) {
    const g1 = svg.g();
    const g2 = svg.g();
    [g1.style.clipPath, g2.style.clipPath] =
      PARTY_PER_CLIP_PATHS[content.direction];
    g1.appendChild(field(content.first));
    g2.appendChild(field(content.second));
    if (content.content) {
      renderIntoParent(
        g1,
        overwriteCounterchangedTincture(content.content, content.second)
      );
      renderIntoParent(
        g2,
        overwriteCounterchangedTincture(content.content, content.first)
      );
    }
    container.appendChild(g1);
    container.appendChild(g2);
  } else if ("quarters" in content) {
    const quartered: Record<Quarter, SVGElement> = {
      1: svg.g(),
      2: svg.g(),
      3: svg.g(),
      4: svg.g(),
    };
    Transform.apply(Transform.of(-25, -30, 0.5), quartered[1]);
    Transform.apply(Transform.of(25, -30, 0.5), quartered[2]);
    Transform.apply(Transform.of(-25, 30, 0.5), quartered[3]);
    Transform.apply(Transform.of(25, 30, 0.5), quartered[4]);
    for (const quartering of content.quarters) {
      for (const quarter of quartering.quarters) {
        complexContent(quartered[quarter], quartering.content);
      }
    }
    for (const e of Object.values(quartered)) {
      container.appendChild(e);
    }
  } else if ("varied" in content) {
    container.appendChild(field(content.first));
    const second = field(content.second);
    second.style.clipPath = `path("${VARIED[content.varied.type](
      content.varied.count ?? undefined
    )}")`;
    container.appendChild(second);
    if (content.content) {
      renderIntoParent(container, content.content);
    }
  } else {
    container.appendChild(field(content.tincture));
    if (content.content) {
      renderIntoParent(container, content.content);
    }
  }
}

function on(parent: SVGElement, { ordinary, surround, charge }: On) {
  const g = svg.g();
  g.appendChild(ORDINARIES[ordinary.ordinary](ordinary.tincture));
  parent.appendChild(g);

  assert(
    charge.direction == null,
    'cannot specify a direction for charges in "on"'
  );

  const parameters = ORDINARIES[ordinary.ordinary].on[charge.count];

  if (parameters != null) {
    const { locator, scale } = parameters;

    for (let i = 0; i < charge.count; ++i) {
      const c = CHARGES[charge.charge](charge.tincture);
      const translate = locator.evaluate(i, charge.count);
      applyTransforms(c, {
        translate,
        scale,
        rotate: charge.posture ?? undefined,
      });
      parent.appendChild(c);
    }
  }

  if (surround) {
    assert(
      surround.direction == null,
      'cannot specify a direction for charges in "between"'
    );
    assert(
      surround.count != null && surround.count !== 1,
      "surround charge must have plural count"
    );
    for (const transform of ORDINARIES[ordinary.ordinary].surround[
      surround.count
    ] ?? []) {
      const c = CHARGES[surround.charge](surround.tincture);
      Transform.apply(transform, c, surround);
      parent.appendChild(c);
    }
  }
}

// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------

const input: HTMLTextAreaElement = document.querySelector("#blazon-input")!;
const form: HTMLFormElement = document.querySelector("#form")!;
const rendered: SVGSVGElement = document.querySelector("#rendered")!;
const error: HTMLPreElement = document.querySelector("#error")!;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  parseAndRenderBlazon(input.value);
});

for (const example of document.querySelectorAll<HTMLAnchorElement>(
  "a.example"
)) {
  example.addEventListener("click", (e) => {
    e.preventDefault();
    input.value = (e!.target as HTMLAnchorElement).innerHTML;
    parseAndRenderBlazon(input.value);
  });
}

parseAndRenderBlazon(input.value);
