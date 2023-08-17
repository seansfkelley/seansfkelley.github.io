/*
TODO
-------------------------------------------------------------------------------
- "quarterly" and "party per cross" are synonymous; make them such
- party per ornament: saltire, quarterly
- finish ornament support: saltire
- InDirection -- at least in the case of chevron and saltire, they are rotated to match
- minor visual effects to make it a little less flat
- fretty?
- "saltirewise" needs to vary based on where the charge is
- more of the same
  - ordinaries
  - ornaments
  - charges
    - are there any other geometric ones?
    - lion, leopard's head, eagle, castle, boar, swan, tree, rose, escallop, and all their variants
- grammar improvements
  - should be able to parse non-redundant usage of colors
    - argent on a bend between six mullets vert
- things I want to be able to render
  - churchill arms
    - fleur de lys
    - inescutcheon
    - escallop
    - fret
  - bavarian arms
  - ???
- embattled ordinaries (chevron, cross counter-embattled) have visible little blips due to the commented-on hack
- remove yOffset from ornaments; it shouldn't be necessary
- add a lexer so the errors have useful names present and don't explode every string literal into characters
- saltires don't extend far enough on the bottom left
  - "Quarterly fourth second 4th and 1st Vert on a saltire cotised Sable a mullet Azure 3rd Argent fourth barry bendy Argent and Vert 3rd Vert fourth Argent."
*/

/*
FUTURE WORK and KNOWN ISSUES
-------------------------------------------------------------------------------
- Tincture references ("of the first", "of the field", etc.) are not supported. Apparently they are
  generally disliked for introducing complexity and ambiguity.
- Charges `on` an ordinary are often too close; especially 2s and 3s, and especially on chief and fess.
- Charges in quartered quadrants aren't pushed around to account for the curvature of the bottom of
  the arms; a proper rendering would make them more cramped rather than cut them off.
- Cantons are proportionally scaled and cropped at the bottom, which mostly works but can cause
  elements in them to appear off-center or clipped. Properly, some elements should get custom
  treatment for the square (rather than rectangular) field in a canton.
- Divided fields ("party per") should be allowed to contain "complex" content (such as other divided
  fields) and not just ordinaries and charges.

NOTES ON THE IMPLEMENTATION
-------------------------------------------------------------------------------
- I did not want _any_ dependencies except the parser, so I re-rolled some things that probably have
  good library implementations, like SVG element factories and SVG paths.
- There are several eras of implementation represented here. This surfaces as, in particular:
  - a mix of hardcoded values and values mathemetically derived from the fields width/height
  - a mix of string-y things like `path` and object-y things like `PathCommand`
- An SVG path editor/debugger is an essential tool. I used https://yqnn.github.io/svg-path-editor/.
*/

// Do this first thing so there's something to see ASAP!
document.querySelector("#no-javascript-alert")!.remove();
document.querySelector("#interactive")!.classList.remove("hidden");

// #region LAYOUT

// TODO: Make _everything_ a function of these proportions.
const H = 120;
const H_2 = H / 2;
const W = 100;
const W_2 = W / 2;

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

// #endregion

// #region TYPES
// ----------------------------------------------------------------------------

interface Node {
  cloneNode<T>(this: T, deep?: boolean): T;
}

declare const grammar: nearley.CompiledRules;
declare const Unparser: (
  grammar: nearley.CompiledRules,
  start: string,
  depth?: number
) => string;

type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends T
  ? V extends T[K]
    ? T
    : never
  : never;

const UNSUPPORTED = Symbol("unsupported");
type Unsupported = typeof UNSUPPORTED;

type Count = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Tincture = string & { __tincture: unknown };
const Tincture = {
  NONE: "none" as Tincture,
  COUNTERCHANGED: "counterchanged" as Tincture,
  of: (tincture: string): Tincture => tincture as Tincture,
};
type VariedName = string & { __varied: unknown };
type Ornament = string & { __ornament: unknown };
type Posture = "palewise" | "fesswise" | "bendwise" | "saltirewise";
const Posture = {
  toRadians: (posture: Posture | undefined): number | undefined => {
    switch (posture) {
      case null:
      case undefined:
        return undefined;
      case "palewise":
        return 0;
      case "fesswise":
        return -Math.PI / 2;
      case "bendwise":
        return -Math.PI / 4;
      case "saltirewise":
        return -Math.PI / 4; // TODO
      default:
        assertNever(posture);
    }
  },
};

type Direction = "pale" | "fess" | "bend" | "chevron" | "saltire";
type InDirection = Direction | "cross";
type Quarter = 1 | 2 | 3 | 4;

type ComplexContent = SimpleField | PartyPerField | Quarterly;
type SimpleContent = Ordinary | Charge | Canton | On;

type SimpleField =
  | {
      tincture: Tincture;
      content?: SimpleContent[];
    }
  | {
      varied: Varied;
      first: Tincture;
      second: Tincture;
      content?: SimpleContent[];
    };

interface Varied {
  type: VariedName;
  count?: number;
}

interface PartyPerField {
  party: Direction;
  first: Tincture;
  second: Tincture;
  content?: SimpleContent;
  ornament?: Ornament;
}

interface Quarterly {
  quarters: Quartering[];
  overall?: SimpleContent;
}

interface Quartering {
  quarters: Quarter[];
  content: ComplexContent;
}

interface Ordinary {
  ordinary: string;
  tincture: Tincture;
  cotised?: Tincture;
  ornament?: Ornament;
}

interface BaseCharge {
  tincture: Tincture;
  count: Count;
  posture?: Posture;
  direction?: InDirection;
}

interface SimpleCharge extends BaseCharge {
  charge: "mullet" | "rondel";
}

interface LionCharge extends BaseCharge {
  charge: "lion";
  armed?: Tincture;
  langued?: Tincture;
  pose: "passant" | "rampant";
}

type Charge = SimpleCharge | LionCharge;

interface Canton {
  canton: Tincture;
  content?: SimpleContent[];
}

interface On {
  on: Ordinary;
  surround?: Charge;
  charge?: Charge;
}

interface OrdinaryRenderer {
  (ordinary: Ordinary): SVGElement;
  on: ParametricLocator;
  surround: ParametricLocator;
  // I'd use non-?-optional `undefined` to mean unsupported, but the compiler complains about
  // implicit `any` if I try that.
  party: ((ornament: Ornament | undefined) => PathCommand.Any[]) | Unsupported;
}

interface ChargeRenderer<T extends Charge> {
  (charge: T): SVGElement;
}

interface VariedClipPathGenerator {
  (count?: number): string;
}

type RelativeOrnamentPath = [
  PathCommand.m,
  PathCommand.Relative[],
  PathCommand.m
];

const RelativeOrnamentPath = {
  rotate: ([start, main, end]: RelativeOrnamentPath, radians: number): void => {
    PathCommand.rotate(start, radians);
    main.forEach((c) => PathCommand.rotate(c, radians));
    PathCommand.rotate(end, radians);
  },
};

interface OrnamentPathGenerator {
  (
    // If negative, assumed to go right-to-left instead of left-to-right.
    xLength: number,
    invertY: boolean,
    // This is only for 'embattled'. It has special rules that means it should only render on the
    // _top_ of ordinaries. "Primary" means top.
    side: "primary" | "secondary",
    alignment?: "start" | "end" | "center"
  ): RelativeOrnamentPath;
}

// #endregion

// #region GRAPHICS PRIMITIVES
// ----------------------------------------------------------------------------

type Coordinate = [x: number, y: number];

const Coordinate = {
  add: (...coordinates: Coordinate[]): Coordinate =>
    coordinates.reduce(([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]),
  subtract: (...coordinates: Coordinate[]): Coordinate =>
    coordinates.reduce(([x1, y1], [x2, y2]) => [x1 - x2, y1 - y2]),
  length: ([x1, y1]: Coordinate, [x2, y2]: Coordinate): number =>
    Math.hypot(x2 - x1, y2 - y1),
  /**
   * Rotates the given coordinates about the origin.
   */
  rotate: ([x, y]: Coordinate, radians: number): Coordinate => {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return [x * cos - y * sin, x * sin + y * cos];
  },
  /**
   * Return the angle of the given line segment, in radians. Returns a value on [-pi, pi], according
   * to the relative direction from the first to second point.
   */
  radians: ([x1, y1]: Coordinate, [x2, y2]: Coordinate): number => {
    if (x1 === x2) {
      // TODO: Confirm this is correct.
      return ((y1 < y2 ? 1 : -1) * Math.PI) / 2;
    } else {
      return Math.atan((y2 - y1) / (x2 - x1)) + (x2 < x1 ? Math.PI : 0);
    }
  },
  /**
   * Reflect the coordinate over the given line segment.
   */
  reflect: (
    [x, y]: Coordinate,
    [x1, y1]: Coordinate,
    [x2, y2]: Coordinate
  ): Coordinate => {
    // Too lazy to figure this out on my own, adapted from https://stackoverflow.com/a/3307181.
    if (x1 === x2) {
      return [x1 - x, y];
    }

    const m = (y2 - y1) / (x2 - x1);
    const c = (x2 * y1 - x1 * y2) / (x2 - x1);
    const d = (x + (y - c) * m) / (1 + m * m);
    return [2 * d - x, 2 * d * m - y + 2 * c];
  },
};

type Quadrilateral = [Coordinate, Coordinate, Coordinate, Coordinate];

const Quadrilateral = {
  toSvgPath: ([p1, p2, p3, p4]: Quadrilateral) => {
    return path`
      M ${p1[0]} ${p1[1]}
      L ${p2[0]} ${p2[1]}
      L ${p3[0]} ${p3[1]}
      L ${p4[0]} ${p4[1]}
      Z
    `;
  },
};

const SVG_ELEMENT_TO_COORDINATES: {
  [K in PathCommand.Any["type"]]: (
    e: DiscriminateUnion<PathCommand.Any, "type", K>
  ) => Coordinate[];
} = {
  l: (e) => [e.loc],
  L: (e) => [e.loc],
  m: (e) => [e.loc],
  M: (e) => [e.loc],
  c: (e) => [e.c1, e.c2, e.end],
  z: () => [],
  Z: () => [],
};

namespace PathCommand {
  type SimpleElement<T extends string> = {
    type: T;
    loc: Coordinate;
  };

  export interface Z {
    type: "Z" | "z";
  }

  export type z = Z;

  export type L = SimpleElement<"L">;
  export type l = SimpleElement<"l">;
  export type M = SimpleElement<"M">;
  export type m = SimpleElement<"m">;

  export interface c {
    type: "c";
    c1: Coordinate;
    c2: Coordinate;
    end: Coordinate;
  }

  export type Relative = m | l | c | Z | z;
  export type Absolute = M | L | Z | z;
  export type Any = Relative | Absolute;

  export function negateX(e: Any): void {
    for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e as never)) {
      c[0] *= -1;
    }
  }

  export function negateY(e: Any): void {
    for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e as never)) {
      c[1] *= -1;
    }
  }

  export function rotate(e: Any, radians: number): void {
    for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e as never)) {
      [c[0], c[1]] = Coordinate.rotate(c, radians);
    }
  }
}

/**
 * Given the line segment defined by src-dst, widen it along the perpendicular into a rotated
 * rectangle. Points are returned in clockwise order from src to dst.
 */
function widen(
  src: Coordinate,
  dst: Coordinate,
  width: number,
  linecap: "butt" | "square" = "butt"
): Quadrilateral {
  const halfWidth = width / 2;
  const angle = Coordinate.radians(src, dst);
  if (linecap === "square") {
    const x = Math.cos(angle) * halfWidth;
    const y = Math.sin(angle) * halfWidth;
    src = Coordinate.add(src, [-x, -y]);
    dst = Coordinate.add(dst, [x, y]);
  }
  // Note! These x/y ~ sin/cos relationships are flipped from the usual, because to widen we need
  // to draw lines perpendicular -- thereby reversing the normal roles of x and y!
  const x = Math.sin(angle) * halfWidth;
  const y = Math.cos(angle) * halfWidth;
  return [
    Coordinate.add(src, [x, -y]),
    Coordinate.add(dst, [x, -y]),
    Coordinate.add(dst, [-x, y]),
    Coordinate.add(src, [-x, y]),
  ];
}

// #endregion

// #region LOCATORS
// ----------------------------------------------------------------------------

function evaluateLineSegment(
  src: Coordinate,
  dst: Coordinate,
  t: number
): Coordinate {
  assert(t >= 0 && t <= 1, "parameter must be on [0, 1]");
  return [(dst[0] - src[0]) * t + src[0], (dst[1] - src[1]) * t + src[1]];
}

interface ParametricLocator {
  forCount(total: number): Generator<[Coordinate, number]>;
}

class NullLocator implements ParametricLocator {
  public *forCount() {
    // nop
  }
}

class LineSegmentLocator implements ParametricLocator {
  constructor(
    private a: Coordinate,
    private b: Coordinate,
    private scales: number[]
  ) {}

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0 || total > this.scales.length) {
      return;
    }

    for (let i = 0; i < total; ++i) {
      yield [
        evaluateLineSegment(this.a, this.b, (i + 1) / (total + 1)),
        this.scales[total - 1],
      ];
    }
  }
}

class SequenceLocator implements ParametricLocator {
  static readonly EMPTY: unique symbol = Symbol("empty");

  constructor(
    private sequence: Coordinate[],
    private scales: number[],
    private exceptions: Record<
      number,
      Coordinate[] | typeof SequenceLocator.EMPTY
    > = {}
  ) {
    assert(
      sequence.length === scales.length,
      "must have the same number of coordinates in sequence as scales"
    );
  }

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0 || total > this.sequence.length) {
      return;
    }

    const sequence = this.exceptions[total] ?? this.sequence;

    if (sequence === SequenceLocator.EMPTY) {
      return;
    }

    for (let i = 0; i < total; ++i) {
      yield [sequence[i], this.scales[total - 1]];
    }
  }
}

class ExhaustiveLocator implements ParametricLocator {
  constructor(private sequences: Coordinate[][], private scales: number[]) {
    assert(
      sequences.length === scales.length,
      "must have the same number of sequences as scales"
    );
    for (let i = 0; i < sequences.length; ++i) {
      assert(
        sequences[i].length === i + 1,
        `sequence at index ${i} must have ${i + 1} elements`
      );
    }
  }

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0 || total > this.sequences.length) {
      return;
    }

    for (const coordinates of this.sequences[total - 1]) {
      yield [coordinates, this.scales[total - 1]];
    }
  }
}

class AlternatingReflectiveLocator implements ParametricLocator {
  constructor(
    private delegate: ParametricLocator,
    private a: Coordinate,
    private b: Coordinate
  ) {}

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0) {
      return;
    }

    const locations =
      total % 2 === 1
        ? [
            ...this.delegate.forCount((total - 1) / 2),
            ...this.reflectSequence(this.delegate.forCount((total + 1) / 2)),
          ]
        : [
            ...this.delegate.forCount(total / 2),
            ...this.reflectSequence(this.delegate.forCount(total / 2)),
          ];

    if (locations.length < total) {
      return;
    }

    for (const l of locations) {
      yield l;
    }
  }

  private *reflectSequence(
    generator: Generator<[Coordinate, number]>
  ): Generator<[Coordinate, number]> {
    for (const [translate, scale] of generator) {
      yield [Coordinate.reflect(translate, this.a, this.b), scale];
    }
  }
}

class ReflectiveLocator implements ParametricLocator {
  constructor(
    private delegate: ParametricLocator,
    private a: Coordinate,
    private b: Coordinate
  ) {}

  public *forCount(total: number): Generator<[Coordinate, number]> {
    for (const [translate, scale] of this.delegate.forCount(total)) {
      yield [Coordinate.reflect(translate, this.a, this.b), scale];
    }
  }
}

class OnChevronLocator implements ParametricLocator {
  constructor(
    private left: Coordinate,
    private midpoint: Coordinate,
    private right: Coordinate,
    private scales: number[]
  ) {}

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0 || total > this.scales.length) {
      return;
    }

    const scale = this.scales[total - 1];

    const halfish = (total % 2 === 1 ? total - 1 : total) / 2;

    for (let i = 0; i < halfish; ++i) {
      yield [
        evaluateLineSegment(this.left, this.midpoint, (i + 1) / (halfish + 1)),
        scale,
      ];
    }

    if (total % 2 === 1) {
      yield [this.midpoint, scale];
    }

    for (let i = 0; i < halfish; ++i) {
      yield [
        evaluateLineSegment(this.midpoint, this.right, (i + 1) / (halfish + 1)),
        scale,
      ];
    }
  }
}

class DefaultChargeLocator implements ParametricLocator {
  private static ROWS = [
    [1],
    [2],
    [2, 1],
    [3, 1],
    [3, 2],
    [3, 2, 1],
    [3, 3, 1],
    [3, 3, 2],
    [3, 3, 3],
    [4, 3, 2, 1],
  ];

  private static SCALES = [
    1.5, //
    0.7,
    0.6,
    0.5,
    0.5,
    0.5,
    0.5,
    0.5,
    0.5,
    0.4,
  ];

  constructor(
    private horizontal: [number, number],
    private vertical: [number, number]
  ) {}

  public *forCount(total: number): Generator<[Coordinate, number]> {
    if (total <= 0 || total > DefaultChargeLocator.ROWS.length) {
      return;
    }

    const rows = DefaultChargeLocator.ROWS[total - 1];
    const step = (this.horizontal[1] - this.horizontal[0]) / (rows[0] + 1);

    for (let i = 0; i < rows.length; ++i) {
      const y =
        ((i + 1) / (rows.length + 1)) * (this.vertical[1] - this.vertical[0]) +
        this.vertical[0];

      // This is a bit weird, and it's different from the LineSegmentLocator. Instead of spacing out
      // each row evenly and individually, we want to make a nice upside-down isoceles triangle:
      // this means that each row must be spaced out equally, in absolute terms. We calculate the
      // spacing (`step`) based on the most crowded row (assumed to be the first one), then here we
      // calculate where each row needs to start in order for this spacing to produce a horizontally-
      // centered row. That is a function of the number of items in this row relative to the number
      // of items in the first row, that is, the row that set the spacing in the first place.
      const offset =
        this.horizontal[0] + step + (step * (rows[0] - rows[i])) / 2;
      for (let j = 0; j < rows[i]; ++j) {
        yield [[offset + step * j, y], DefaultChargeLocator.SCALES[total - 1]];
      }
    }
  }
}

// #endregion

// #region UTILITIES
// ----------------------------------------------------------------------------

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`assertion failure: ${message}`);
  }
}

function assertNever(nope: never): never {
  throw new Error("was not never");
}

// Not foolproof, but simple and suitable for us.
function deepEqual<T>(one: T, two: T): boolean {
  if (one == null || two == null) {
    return one === two;
  } else if (Array.isArray(one) && Array.isArray(two)) {
    return (
      one.length === two.length && one.every((o, i) => deepEqual(o, two[i]))
    );
  } else if (typeof one === "object" && typeof two === "object") {
    const oneKeys = Object.getOwnPropertyNames(one);
    const twoKeys = Object.getOwnPropertyNames(two);
    return (
      deepEqual(oneKeys, twoKeys) &&
      oneKeys.every((k) => deepEqual((one as any)[k], (two as any)[k]))
    );
  } else {
    return one === two;
  }
}

function applyTransforms(
  element: SVGElement,
  {
    origin,
    translate,
    scale,
    rotate,
  }: {
    origin?: Coordinate;
    translate?: Coordinate;
    scale?: number | Coordinate;
    rotate?: number;
  } = {}
): void {
  const transform = [
    translate != null
      ? `translate(${translate[0]}, ${translate[1]})`
      : undefined,
    typeof scale === "number" && scale !== 1
      ? `scale(${scale})`
      : Array.isArray(scale)
      ? `scale(${scale[0]}, ${scale[1]})`
      : undefined,
    rotate != null ? `rotate(${(rotate / (2 * Math.PI)) * 360})` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  if (origin != null) {
    element.setAttribute("transform-origin", `${origin[0]} ${origin[1]}`);
  }
  element.setAttribute("transform", transform);
}

function roundToPrecision(n: number, precision: number = 0): number {
  assert(precision >= 0, "precision must be non-negative"); // It's well-defined, but not useful to me.
  const magnitude = Math.pow(10, precision);
  return Math.round(n * magnitude) / magnitude;
}

const svg = {
  path: (d: string, tincture: Tincture): SVGPathElement => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.classList.add(`fill-${tincture}`);
    return path;
  },
  line: (
    [x1, y1]: Coordinate,
    [x2, y2]: Coordinate,
    tincture: Tincture,
    width: number = 1,
    linecap: "butt" | "round" | "square" = "butt"
  ): SVGLineElement => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", `${x1}`);
    line.setAttribute("y1", `${y1}`);
    line.setAttribute("x2", `${x2}`);
    line.setAttribute("y2", `${y2}`);
    line.classList.add(`stroke-${tincture}`);
    line.setAttribute("stroke-width", `${width}`);
    line.setAttribute("stroke-linecap", linecap);
    return line;
  },
  rect: (
    [x1, y1]: Coordinate,
    [x2, y2]: Coordinate,
    tincture: Tincture
  ): SVGRectElement => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", `${x1}`);
    rect.setAttribute("y", `${y1}`);
    rect.setAttribute("width", `${x2 - x1}`);
    rect.setAttribute("height", `${y2 - y1}`);
    rect.classList.add(`fill-${tincture}`);
    return rect;
  },
  g: (...children: SVGElement[]): SVGGElement => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    for (const c of children) {
      g.appendChild(c);
    }
    return g;
  },
};

function path(strings: TemplateStringsArray, ...values: number[]): string {
  const parts = [];
  for (let i = 0; i < values.length; ++i) {
    parts.push(strings[i], values[i]);
  }
  parts.push(strings.at(-1));
  return parts.join("").trim().replaceAll("\n", "").replaceAll(/ +/g, " ");
}

path.from = (...elements: (PathCommand.Any | PathCommand.Any[])[]): string => {
  return elements
    .flat()
    .map(
      (e) =>
        `${e.type} ${SVG_ELEMENT_TO_COORDINATES[e.type](e as never)
          .map(
            ([x, y]) => `${roundToPrecision(x, 3)} ${roundToPrecision(y, 3)}`
          )
          .join(" ")}`
    )
    .join(" ");
};

const complexSvgCache: Record<string, SVGElement> = {};

function getComplexSvgSync(kind: string, variant?: string): SVGElement {
  const key = variant ? `${kind}-${variant}` : kind;
  if (key in complexSvgCache) {
    return complexSvgCache[key];
  } else {
    throw new Error(`still waiting for ${key}.svg to load!`);
  }
}

async function fetchComplexSvg(kind: string, variant?: string): Promise<void> {
  const key = variant ? `${kind}-${variant}` : kind;
  const response = await fetch(`/assets/blazonry/svg/${key}.svg`);
  const root = new DOMParser().parseFromString(
    await response.text(),
    "image/svg+xml"
  ).documentElement as any as SVGElement;
  const wrapper = svg.g();
  wrapper.classList.add(kind);
  for (const c of root.children) {
    wrapper.appendChild(c);
  }
  complexSvgCache[key] = wrapper;
}

// #endregion

// #region ORDINARIES
// ----------------------------------------------------------------------------

const COTISED_WIDTH = W_2 / 10;

const BEND_WIDTH = W / 3;
// Make sure it's long enough to reach diagonally!
const BEND_LENGTH = Math.hypot(W, H);
function bend({ tincture, cotised, ornament }: Ordinary) {
  const bend = svg.g();

  if (ornament != null) {
    bend.appendChild(
      svg.path(
        path.from(
          relativePathsToClosedLoop(
            ORNAMENTS[ornament](BEND_LENGTH, -BEND_WIDTH / 2, false, "primary"),
            // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
            // we traverse around the bend clockwise.
            ORNAMENTS[ornament](
              -BEND_LENGTH,
              BEND_WIDTH / 2,
              true,
              "secondary",
              "end"
            )
          )
        ),
        tincture
      )
    );
  } else {
    bend.appendChild(svg.line([0, 0], [BEND_LENGTH, 0], tincture, BEND_WIDTH));
  }

  if (cotised != null) {
    const offset = BEND_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
    bend.appendChild(
      svg.line([0, -offset], [BEND_LENGTH, -offset], cotised, COTISED_WIDTH)
    );
    bend.appendChild(
      svg.line([0, offset], [BEND_LENGTH, offset], cotised, COTISED_WIDTH)
    );
  }

  applyTransforms(bend, {
    translate: [-W_2, -H_2],
    rotate: Math.PI / 4,
  });

  return svg.g(bend);
}

bend.on = new LineSegmentLocator(
  [-W_2, -H_2],
  [W_2, -H_2 + W],
  [0.5, 0.5, 0.5, 0.5, 0.4, 0.35, 0.3, 0.25]
);

bend.surround = new AlternatingReflectiveLocator(
  new ExhaustiveLocator(
    [
      [
        [W_2 - 22, -H_2 + 22], //
      ],
      [
        [W_2 - 35, -H_2 + 15], //
        [W_2 - 15, -H_2 + 35],
      ],
      [
        [W_2 - 15, -H_2 + 15], //
        [W_2 - 40, -H_2 + 15],
        [W_2 - 15, -H_2 + 40],
      ],
    ],
    [0.7, 0.5, 0.4]
  ),
  [-W_2, -H_2],
  [W_2, -H_2 + W]
);

bend.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const topLeft: Coordinate = [-W_2, -H_2];
  const topRight: Coordinate = [W_2, -H_2];
  const bottomRight = Coordinate.add(topLeft, [BEND_LENGTH, BEND_LENGTH]);
  if (ornament == null) {
    return [
      { type: "M", loc: topLeft },
      { type: "L", loc: bottomRight },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  } else {
    const ornamentPath = ORNAMENTS[ornament](
      BEND_LENGTH,
      false,
      "primary",
      "start"
    );
    RelativeOrnamentPath.rotate(ornamentPath, Math.PI / 4);
    return [
      { type: "M", loc: topLeft },
      { type: "l", loc: ornamentPath[0].loc },
      ...ornamentPath[1],
      { type: "l", loc: ornamentPath[2].loc },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  }
};

function bendSinister(ordinary: Ordinary) {
  const g = svg.g(bend(ordinary));
  applyTransforms(g, {
    scale: [-1, 1],
  });
  return g;
}

bendSinister.on = new AlternatingReflectiveLocator(
  bend.on,
  [0, -H_2],
  [0, H_2]
);

bendSinister.surround = new ReflectiveLocator(
  bend.surround,
  [0, -H_2],
  [0, H_2]
);

bendSinister.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const commands = bend.party(ornament);
  commands.forEach(PathCommand.negateX);
  return commands;
};

const CHIEF_WIDTH = H / 3;
function chief({ tincture, cotised, ornament }: Ordinary) {
  const chief = svg.g();

  if (ornament != null) {
    const [start, main, end] = ORNAMENTS[ornament](
      -W,
      CHIEF_WIDTH,
      true,
      "primary",
      "center"
    );
    chief.appendChild(
      svg.path(
        path.from(
          { type: "M", loc: [-W_2, -H_2] },
          { type: "L", loc: [W_2, -H_2] },
          { type: "l", loc: start.loc },
          main,
          { type: "l", loc: end.loc }
        ),
        tincture
      )
    );
  } else {
    chief.appendChild(
      svg.line(
        [-W_2, -H_2 + CHIEF_WIDTH / 2],
        [W_2, -H_2 + CHIEF_WIDTH / 2],
        tincture,
        CHIEF_WIDTH
      )
    );
  }

  if (cotised != null) {
    chief.append(
      svg.line(
        [-W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2],
        [W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2],
        cotised,
        COTISED_WIDTH
      )
    );
  }

  return chief;
}

chief.on = new LineSegmentLocator(
  [-W_2, -H_2 + H_2 / 3],
  [W_2, -H_2 + H_2 / 3],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
);

chief.surround = new NullLocator();

chief.party = UNSUPPORTED;

const CHEVRON_WIDTH = W / 4;

function chevron({ tincture, cotised, ornament }: Ordinary) {
  const left: Coordinate = [-W_2, -H_2 + W];
  const right: Coordinate = [-W_2 + H, H_2];
  // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
  const mid: Coordinate = [0, -(H_2 - W_2)];

  const chevron = svg.g();

  if (ornament != null) {
    const topLength = Coordinate.length(mid, right) + CHEVRON_WIDTH / 2;
    const bottomLength = Coordinate.length(mid, right) - CHEVRON_WIDTH / 2;
    for (const sign of [-1, 1]) {
      const [topStart, topMain, topEnd] = ORNAMENTS[ornament](
        topLength,
        false,
        "primary",
        "start"
      );
      const [bottomStart, bottomMain, bottomEnd] = ORNAMENTS[ornament](
        -bottomLength,
        true,
        "secondary",
        "end"
      );

      const p = svg.path(
        path.from(
          { type: "m", loc: topStart.loc }, //
          topMain,
          {
            type: "l",
            loc: Coordinate.add(
              topEnd.loc,
              [0, CHEVRON_WIDTH],
              bottomStart.loc
            ),
          },
          bottomMain,
          {
            type: "l",
            // topStart appears here because we want to ensure that the line from the first point
            // (which is topStart) to the last point is at pi/4 (ignoring the hack immediately
            // below). We are guaranteed that it is pi/4 from 0, 0 to bottomEnd, but since we shift
            // it by topStart we need to shift it here too.
            loc: Coordinate.add(topStart.loc, bottomEnd.loc),
          },
          // HACK: juke out of the way a bit to overlap with the other side. Ensures that the very
          // skinny point at the top of the chevron doesn't turn itself inside out and fill the
          // wrong side when using e.g. engrailed.
          { type: "l", loc: [-CHEVRON_WIDTH / 10, 0] },
          { type: "z" }
        ),
        tincture
      );
      applyTransforms(p, {
        origin: topStart.loc,
        scale: [sign, 1],
        rotate: Math.PI / 4,
        translate: Coordinate.add(mid, [
          0,
          -Math.hypot(CHEVRON_WIDTH, CHEVRON_WIDTH) / 2,
        ]),
      });
      chevron.append(p);
    }
  } else {
    chevron.appendChild(svg.line(left, mid, tincture, CHEVRON_WIDTH, "square"));
    chevron.appendChild(
      svg.line(mid, right, tincture, CHEVRON_WIDTH, "square")
    );
  }

  if (cotised != null) {
    // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
    const offset = Math.sin(Math.PI / 4) * CHEVRON_WIDTH + COTISED_WIDTH * 2;

    for (const end of [left, right]) {
      for (const sign of [-1, 1]) {
        chevron.appendChild(
          svg.line(
            Coordinate.add(end, [0, sign * offset]),
            Coordinate.add(mid, [0, sign * offset]),
            cotised,
            COTISED_WIDTH,
            "square"
          )
        );
      }
    }
  }

  return chevron;
}

chevron.on = new OnChevronLocator(
  [-W_2, W_2 - 10],
  [0, -10],
  [W_2, W_2 - 10],
  [0.4, 0.4, 0.4, 0.4, 0.35, 0.35, 0.3, 0.25]
);

chevron.surround = new ExhaustiveLocator(
  [
    [
      [0, H_2 - 25], //
    ],
    [
      [0, H_2 - 25], //
      [0, -H_2 + 18],
    ],
    [
      [0, H_2 - 25], //
      [-20, -H_2 + 18],
      [20, -H_2 + 18],
    ],
    [
      [0, H_2 - 25], //
      [0, -H_2 + 18],
      [-30, -H_2 + 30],
      [30, -H_2 + 30],
    ],
  ],
  [0.5, 0.5, 0.5, 0.5]
);

chevron.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const [topLeft, midLeft, mid, midRight, topRight] = [
    [-W_2, -H_2],
    // See the main renderer for how these values are picked.
    [-W_2, -H_2 + W],
    [0, -(H_2 - W_2)],
    [W_2, -H_2 + W],
    [W_2, -H_2],
  ] satisfies Coordinate[];

  if (ornament == null) {
    return [
      { type: "M", loc: topLeft },
      { type: "L", loc: midLeft },
      { type: "L", loc: mid },
      { type: "L", loc: midRight },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  } else {
    const [leftStart, leftMain, leftEnd] = ORNAMENTS[ornament](
      Coordinate.length(midLeft, mid),
      false,
      "primary",
      "end"
    );
    const [rightStart, rightMain, rightEnd] = ORNAMENTS[ornament](
      Coordinate.length(mid, midRight),
      false,
      "primary",
      "start"
    );
    leftMain.forEach((c) => PathCommand.rotate(c, -Math.PI / 4));
    rightMain.forEach((c) => PathCommand.rotate(c, Math.PI / 4));
    return [
      { type: "M", loc: topLeft },
      { type: "L", loc: midLeft },
      {
        type: "l",
        loc: Coordinate.rotate(
          Coordinate.add(leftStart.loc, leftEnd.loc),
          -Math.PI / 4
        ),
      },
      ...leftMain,
      ...rightMain,
      {
        type: "l",
        loc: Coordinate.rotate(
          Coordinate.add(rightEnd.loc, rightStart.loc),
          Math.PI / 4
        ),
      },
      { type: "L", loc: midRight },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  }
};

// Ensure that the sides and top arms are all the same length!
const CROSS_WIDTH = W / 4;
const CROSS_VERTICAL_OFFSET = (H - W) / 2;

function cross({ tincture, cotised, ornament }: Ordinary) {
  const top: Coordinate = [0, -H_2];
  const bottom: Coordinate = [0, H_2];
  const left: Coordinate = [-W_2, -CROSS_VERTICAL_OFFSET];
  const right: Coordinate = [W_2, -CROSS_VERTICAL_OFFSET];

  const cross = svg.g();

  if (ornament != null) {
    const g = svg.g();

    const hLength = W_2 - CROSS_WIDTH / 2;
    const vLength = H_2 - CROSS_WIDTH / 2 + CROSS_VERTICAL_OFFSET;

    const ornamentations = [
      // Starting on the bottom right, moving around counter-clockwise.
      ORNAMENTS[ornament](-vLength, false, "secondary", "end"),
      ORNAMENTS[ornament](hLength, true, "secondary", "start"),
      straightLineOrnamenter(-CROSS_WIDTH),
      ORNAMENTS[ornament](-hLength, false, "primary", "end"),
      ORNAMENTS[ornament](-vLength, false, "secondary", "start"),
      straightLineOrnamenter(-CROSS_WIDTH),
      ORNAMENTS[ornament](vLength, true, "secondary", "end"),
      ORNAMENTS[ornament](-hLength, false, "primary", "start"),
      straightLineOrnamenter(CROSS_WIDTH),
      ORNAMENTS[ornament](hLength, true, "secondary", "end"),
      ORNAMENTS[ornament](vLength, true, "secondary", "start"),
    ];

    for (const index of [0, 2, 4, 6, 8, 10]) {
      RelativeOrnamentPath.rotate(ornamentations[index], Math.PI / 2);
    }

    g.appendChild(
      svg.path(
        path.from(relativePathsToClosedLoop(...ornamentations)),
        tincture
      )
    );

    applyTransforms(g, {
      // I _think_ this is the correct offset: the vertical offset is accounted for by being
      // included in the vertical length, and even though the first ornamentation can vary in length
      // depending on the type, the end-alignment means that it'll grow downwards, out of view.
      translate: [CROSS_WIDTH / 2, H_2],
    });

    cross.appendChild(g);
  } else {
    cross.appendChild(svg.line(top, bottom, tincture, CROSS_WIDTH));
    cross.appendChild(svg.line(left, right, tincture, CROSS_WIDTH));
  }

  if (cotised != null) {
    const offset = CROSS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
    const mid: Coordinate = [0, -CROSS_VERTICAL_OFFSET];

    for (const [p, [x1sign, y1sign], [x2sign, y2sign]] of [
      [top, [-1, -1], [1, -1]],
      [bottom, [-1, 1], [1, 1]],
      [left, [-1, -1], [-1, 1]],
      [right, [1, 1], [1, -1]],
    ] as const) {
      cross.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x1sign, offset * y1sign]),
          Coordinate.add(mid, [offset * x1sign, offset * y1sign]),
          cotised,
          COTISED_WIDTH,
          "square"
        )
      );
      cross.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x2sign, offset * y2sign]),
          Coordinate.add(mid, [offset * x2sign, offset * y2sign]),
          cotised,
          COTISED_WIDTH,
          "square"
        )
      );
    }
  }

  return cross;
}

cross.on = new SequenceLocator(
  [
    [-H_2 / 2, -CROSS_VERTICAL_OFFSET],
    [H_2 / 2, -CROSS_VERTICAL_OFFSET],
    [0, -H_2 / 2 - CROSS_VERTICAL_OFFSET],
    [0, H_2 / 2 - CROSS_VERTICAL_OFFSET],
    [0, -CROSS_VERTICAL_OFFSET],
  ],
  [0.4, 0.4, 0.4, 0.4, 0.4],
  {
    1: [[0, -CROSS_VERTICAL_OFFSET]],
  }
);

const CROSS_SECTOR_2 = (W - CROSS_WIDTH) / 4;

cross.surround = new SequenceLocator(
  [
    [W_2 - CROSS_SECTOR_2, -H_2 + CROSS_SECTOR_2],
    [-W_2 + CROSS_SECTOR_2, -H_2 + CROSS_SECTOR_2],
    [
      -W_2 + CROSS_SECTOR_2,
      CROSS_SECTOR_2 - CROSS_VERTICAL_OFFSET + CROSS_WIDTH / 2,
    ],
    [
      W_2 - CROSS_SECTOR_2,
      CROSS_SECTOR_2 - CROSS_VERTICAL_OFFSET + CROSS_WIDTH / 2,
    ],
  ],
  [0.5, 0.5, 0.5, 0.5],
  {
    1: SequenceLocator.EMPTY,
  }
);

// Technically this is synonymous with "quarterly", but the code architecture makes it annoying to
// do that without breaking the abstraction. It'll just be unsupported instead.
cross.party = UNSUPPORTED;

const FESS_WIDTH = W / 3;
const FESS_VERTICAL_OFFSET = -H_2 + FESS_WIDTH * (3 / 2);
function fess({ tincture, cotised, ornament }: Ordinary) {
  const fess = svg.g();

  if (ornament != null) {
    fess.appendChild(
      svg.path(
        path.from(
          {
            type: "m",
            loc: [-W_2, FESS_VERTICAL_OFFSET - FESS_WIDTH / 2],
          },
          relativePathsToClosedLoop(
            ORNAMENTS[ornament](W, false, "primary", "center"),
            [
              { type: "m", loc: [0, 0] },
              [{ type: "l", loc: [0, FESS_WIDTH] }],
              { type: "m", loc: [0, 0] },
            ],
            ORNAMENTS[ornament](-W, true, "secondary", "center")
          )
        ),
        tincture
      )
    );
  } else {
    fess.appendChild(
      svg.line(
        [-W_2, FESS_VERTICAL_OFFSET],
        [W_2, FESS_VERTICAL_OFFSET],
        tincture,
        FESS_WIDTH
      )
    );
  }

  if (cotised != null) {
    const offset = FESS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;

    fess.appendChild(
      svg.line(
        [-W_2, FESS_VERTICAL_OFFSET - offset],
        [W_2, FESS_VERTICAL_OFFSET - offset],
        cotised,
        COTISED_WIDTH
      )
    );
    fess.appendChild(
      svg.line(
        [-W_2, FESS_VERTICAL_OFFSET + offset],
        [W_2, FESS_VERTICAL_OFFSET + offset],
        cotised,
        COTISED_WIDTH
      )
    );
  }

  return fess;
}

fess.on = new LineSegmentLocator(
  [-W_2, FESS_VERTICAL_OFFSET],
  [W_2, FESS_VERTICAL_OFFSET],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
);

fess.surround = new AlternatingReflectiveLocator(
  new LineSegmentLocator(
    [-W_2, -H_2 + FESS_WIDTH / 2],
    [W_2, -H_2 + FESS_WIDTH / 2],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [-W_2, FESS_VERTICAL_OFFSET],
  [W_2, FESS_VERTICAL_OFFSET]
);

fess.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const [topLeft, midLeft, midRight, topRight] = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "L", loc: [-W_2, -H / 10] },
    { type: "L", loc: [W_2, -H / 10] },
    { type: "L", loc: [W_2, -H_2] },
  ] satisfies PathCommand.Any[];

  if (ornament == null) {
    return [topLeft, midLeft, midRight, topRight, { type: "Z" }];
  } else {
    const [start, main, end] = ORNAMENTS[ornament](
      W,
      false,
      "primary",
      "center"
    );
    return [
      topLeft,
      midLeft,
      { type: "l", loc: start.loc },
      ...main,
      { type: "l", loc: end.loc },
      midRight,
      topRight,
      { type: "Z" },
    ];
  }
};

const PALE_WIDTH = W / 3;
function pale({ tincture, cotised, ornament }: Ordinary) {
  const pale = svg.g();

  if (ornament != null) {
    const p = svg.path(
      path.from(
        relativePathsToClosedLoop(
          ORNAMENTS[ornament](H, -PALE_WIDTH / 2, false, "primary"),
          // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
          // we traverse around the pale clockwise.
          ORNAMENTS[ornament](-H, PALE_WIDTH / 2, true, "secondary", "end")
        )
      ),
      tincture
    );
    applyTransforms(p, {
      translate: [0, -H_2],
      rotate: Math.PI / 2,
    });
    pale.appendChild(p);
  } else {
    pale.appendChild(svg.line([0, -H_2], [0, H_2], tincture, PALE_WIDTH));
  }

  if (cotised != null) {
    const offset = PALE_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;

    pale.appendChild(
      svg.line([offset, -H_2], [offset, H_2], cotised, COTISED_WIDTH)
    );
    pale.appendChild(
      svg.line([-offset, -H_2], [-offset, H_2], cotised, COTISED_WIDTH)
    );
  }

  return pale;
}

pale.on = new LineSegmentLocator(
  [0, -H_2],
  [0, H_2],
  [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]
);

pale.surround = new AlternatingReflectiveLocator(
  new LineSegmentLocator(
    [-W_2 + PALE_WIDTH / 2, -H_2],
    [-W_2 + PALE_WIDTH / 2, H_2],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [0, -H_2],
  [0, H_2]
);

pale.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const [topLeft, topMid, bottomMid, bottomLeft] = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "L", loc: [0, -H_2] },
    { type: "L", loc: [0, H_2] },
    { type: "L", loc: [-W_2, H_2] },
  ] satisfies PathCommand.Any[];

  if (ornament == null) {
    return [topLeft, topMid, bottomMid, bottomLeft, { type: "Z" }];
  } else {
    const [start, main, end] = ORNAMENTS[ornament](
      H,
      false,
      "primary",
      "start"
    );
    main.forEach((c) => PathCommand.rotate(c, Math.PI / 2));
    return [
      topLeft,
      topMid,
      { type: "l", loc: Coordinate.rotate(start.loc, Math.PI / 2) },
      ...main,
      { type: "l", loc: Coordinate.rotate(end.loc, Math.PI / 2) },
      bottomMid,
      bottomLeft,
      { type: "Z" },
    ];
  }
};

const SALTIRE_WIDTH = W / 4;
function saltire({ tincture, cotised }: Ordinary) {
  const tl: Coordinate = [-W_2, -H_2];
  const tr: Coordinate = [W_2, -H_2];
  const bl: Coordinate = [-W_2, -H_2 + W];
  const br: Coordinate = [-W_2 + H, H_2];

  const saltire = svg.g();
  saltire.appendChild(svg.line(tl, br, tincture, SALTIRE_WIDTH));
  saltire.appendChild(svg.line(bl, tr, tincture, SALTIRE_WIDTH));

  if (cotised != null) {
    // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
    const offset = Math.sin(Math.PI / 4) * SALTIRE_WIDTH + COTISED_WIDTH * 2;
    // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
    const mid: Coordinate = [0, -(H_2 - W_2)];

    for (const [p, [x1sign, y1sign], [x2sign, y2sign]] of [
      [tl, [-1, 0], [0, -1]],
      [tr, [0, -1], [1, 0]],
      [bl, [-1, 0], [0, 1]],
      [br, [0, 1], [1, 0]],
    ] as const) {
      saltire.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x1sign, offset * y1sign]),
          Coordinate.add(mid, [offset * x1sign, offset * y1sign]),
          cotised,
          COTISED_WIDTH,
          "square"
        )
      );
      saltire.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x2sign, offset * y2sign]),
          Coordinate.add(mid, [offset * x2sign, offset * y2sign]),
          cotised,
          COTISED_WIDTH,
          "square"
        )
      );
    }
  }

  return saltire;
}

saltire.on = new SequenceLocator(
  [
    [-25, -35],
    [25, -35],
    [25, 15],
    [-25, 15],
    [0, -10],
  ],
  [0.5, 0.5, 0.5, 0.5, 0.5],
  {
    1: [[0, -10]],
  }
);

saltire.surround = new SequenceLocator(
  [
    [0, -H_2 + 12],
    [-W_2 + 12, -10],
    [W_2 - 12, -10],
    [0, -H_2 + W - 12],
  ],
  [0.5, 0.5, 0.5, 0.5],
  {
    1: SequenceLocator.EMPTY,
  }
);

saltire.party = (ornament: Ornament | undefined): PathCommand.Any[] => {
  const [topLeft, topRight, bottomLeft, bottomRight] = [
    { type: "L", loc: [-W_2, -H_2] },
    { type: "L", loc: [W_2, -H_2] },
    { type: "L", loc: [-W_2, -H_2 + W] },
    { type: "L", loc: [W_2, -H_2 + W] },
  ] satisfies PathCommand.Any[];

  if (ornament == null) {
    return [
      { type: "M", loc: topLeft.loc },
      bottomRight,
      topRight,
      bottomLeft,
      { type: "Z" },
    ];
  } else {
    // TODO: What makes sense here?
    return [];
  }
};

const ORDINARIES: Record<string, OrdinaryRenderer> = {
  bend,
  "bend sinister": bendSinister,
  chevron,
  chief,
  cross,
  fess,
  pale,
  saltire,
};

// #endregion

// #region CHARGES
// ----------------------------------------------------------------------------

function rondel({ tincture }: SimpleCharge) {
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

function mullet({ tincture }: SimpleCharge) {
  return svg.path(
    // These awkward numbers keep the proportions nice while just filling out a 40x40 square.
    "M 0 -18.8 L 5 -4.6 L 20 -4.6 L 8.4 4.5 L 12.5 18.8 L 0 10.4 L -12.5 18.8 L -8.4 4.5 L -20 -4.6 L -5 -4.6 Z",
    tincture
  );
}

function lion({ tincture, armed, langued, pose }: LionCharge) {
  const lion = getComplexSvgSync("lion", pose).cloneNode(true);
  lion.classList.add(tincture);
  if (armed != null) {
    lion.classList.add(`armed-${armed}`);
  }
  if (langued != null) {
    lion.classList.add(`langued-${langued}`);
  }
  return lion;
}

const CHARGE_DIRECTIONS: Record<InDirection | "none", ParametricLocator> = {
  none: new DefaultChargeLocator([-W_2, W_2], [-H_2, H_2 - 10]),
  fess: fess.on,
  pale: pale.on,
  bend: bend.on,
  chevron: chevron.on,
  saltire: saltire.on,
  cross: cross.on,
};

const SIMPLE_CHARGES: {
  [K in SimpleCharge["charge"]]: ChargeRenderer<
    DiscriminateUnion<Charge, "charge", K>
  >;
} = { rondel, mullet };

// A little unfortunate this dispatching wrapper is necessary, but it's the only way to type-safety
// render based on the string. Throwing all charges, simple and otherwise, into a constant mapping
// together means the inferred type of the function has `never` as the first argument. :(
function renderCharge(charge: Charge): SVGElement {
  switch (charge.charge) {
    case "rondel":
    case "mullet":
      return SIMPLE_CHARGES[charge.charge](charge);
    case "lion":
      return lion(charge);
    default:
      assertNever(charge);
  }
}

// #endregion

// #region ORNAMENT
// ----------------------------------------------------------------------------

function wrapSimpleOrnamenter(
  ornamenter: (length: number) => RelativeOrnamentPath,
  isPatternCycleComposite: boolean,
  onlyRenderPrimary: boolean
): OrnamentPathGenerator {
  function mutatinglyApplyTransforms(
    [start, main, end]: RelativeOrnamentPath,
    {
      invertX = false,
      invertY = false,
      alignToEnd = false,
    }: {
      invertX?: boolean;
      invertY?: boolean;
      alignToEnd?: boolean;
    }
  ): RelativeOrnamentPath {
    if (alignToEnd) {
      [start, end] = [end, start];
      main.reverse();
      start.loc[0] += end.loc[0];
      end.loc[0] = 0;
      // Swapping start and end means that the adjustments to get to/from the starting baseline are
      // now in the opposite order, so we'll offset the other direction! Negate them.
      start.loc[1] *= -1;
      end.loc[1] *= -1;
      // If the pattern is composite, each of the pieces of the cycle now has the same problem as
      // the start/end, since their ordering is reversed. Negate them too.
      if (isPatternCycleComposite) {
        for (const e of main) {
          PathCommand.negateY(e);
        }
      }
    }

    if (invertX) {
      PathCommand.negateX(start);
      for (const e of main) {
        PathCommand.negateX(e);
      }
      PathCommand.negateX(end);
    }

    if (invertY) {
      PathCommand.negateY(start);
      for (const e of main) {
        PathCommand.negateY(e);
      }
      PathCommand.negateY(end);
    }

    return [start, main, end];
  }

  return (xLength, invertY, side, alignment = "start") => {
    const chosenOrnamenter =
      side !== "primary" && onlyRenderPrimary
        ? straightLineOrnamenter
        : ornamenter;

    const invertX = xLength < 0;
    const length = Math.abs(xLength);
    if (alignment === "start") {
      return mutatinglyApplyTransforms(chosenOrnamenter(length), {
        invertX,
        invertY,
      });
    } else if (alignment === "end") {
      return mutatinglyApplyTransforms(chosenOrnamenter(length), {
        invertX,
        invertY,
        alignToEnd: true,
      });
    } else if (alignment === "center") {
      const [start, firstMain] = mutatinglyApplyTransforms(
        chosenOrnamenter(length / 2),
        { alignToEnd: true }
      );

      const [, secondMain, end] = chosenOrnamenter(length / 2);
      return mutatinglyApplyTransforms(
        [start, [...firstMain, ...secondMain], end],
        { invertX, invertY }
      );
    } else {
      assertNever(alignment);
    }
  };
}

function relativePathsToClosedLoop(
  ...paths: RelativeOrnamentPath[]
): PathCommand.Relative[] {
  const commands: PathCommand.Relative[] = [
    paths[0][0],
    ...paths[0][1],
    paths[0][2],
  ];
  for (const [start, middle, end] of paths.slice(1)) {
    const previous = commands.pop();
    assert(
      previous != null && previous.type === "m",
      "commands must always end in m"
    );
    commands.push(
      { type: "l", loc: Coordinate.add(previous.loc, start.loc) },
      ...middle,
      end
    );
  }
  commands.pop();
  commands.push({ type: "z" });
  return commands;
}

relativePathsToClosedLoop.debug = (
  ...paths: RelativeOrnamentPath[]
): PathCommand.Relative[] => {
  return paths.flat(2).map((c) => (c.type === "m" ? { ...c, type: "l" } : c));
};

function straightLineOrnamenter(length: number): RelativeOrnamentPath {
  return [
    { type: "m", loc: [0, 0] },
    [{ type: "l", loc: [length, 0] }],
    { type: "m", loc: [0, 0] },
  ];
}

function embattled(length: number): RelativeOrnamentPath {
  const xStep = W / 12;
  const yStep = xStep / 2;

  const points: Coordinate[] = [[xStep / 2, 0]];

  let x = length - xStep / 2;
  let y = yStep / 2;
  while (x > 0) {
    points.push([0, -yStep], [xStep, 0]);
    x -= xStep;
    y -= yStep;
    if (x > 0) {
      points.push([0, yStep], [xStep, 0]);
      x -= xStep;
      y += yStep;
    }
  }

  return [
    { type: "m", loc: [0, yStep / 2] },
    points.map((loc) => ({ type: "l", loc })),
    { type: "m", loc: [x, -y] },
  ];
}

function engrailed(length: number): RelativeOrnamentPath {
  const width = W / 6;
  const height = width / 6;
  const iterations = Math.ceil(length / width);

  const curves: PathCommand.c[] = [];

  for (let i = 0; i < iterations; ++i) {
    curves.push({
      type: "c",
      c1: [width / 4, height * 2],
      c2: [(3 * width) / 4, height * 2],
      end: [width, 0],
    });
  }

  return [
    { type: "m", loc: [0, -height / 2] },
    curves,
    { type: "m", loc: [length - iterations * width, height / 2] },
  ];
}

function indented(length: number): RelativeOrnamentPath {
  const size = W / 12;

  const points: Coordinate[] = [];

  let x = length;
  let y = -size / 2;
  while (x > 0) {
    points.push([size, size]);
    x -= size;
    y += size;
    if (x > 0) {
      points.push([size, -size]);
      x -= size;
      y -= size;
    }
  }

  return [
    { type: "m", loc: [0, -size / 2] },
    points.map((loc) => ({ type: "l", loc })),
    { type: "m", loc: [x, -y] },
  ];
}

function wavy(length: number): RelativeOrnamentPath {
  const halfWidth = W / 12;

  const curves: PathCommand.c[] = [];

  let x = length;
  let y = -halfWidth / 4;
  while (x > 0) {
    curves.push({
      type: "c",
      c1: [halfWidth / 2, 0],
      c2: [halfWidth / 2, halfWidth / 2],
      end: [halfWidth, halfWidth / 2],
    });
    x -= halfWidth;
    y += halfWidth / 2;
    if (x > 0) {
      curves.push({
        type: "c",
        c1: [halfWidth / 2, 0],
        c2: [halfWidth / 2, -halfWidth / 2],
        end: [halfWidth, -halfWidth / 2],
      });
      x -= halfWidth;
      y -= halfWidth / 2;
    }
  }

  return [
    { type: "m", loc: [0, -halfWidth / 4] },
    curves,
    { type: "m", loc: [x, -y] },
  ];
}

const ORNAMENTS: Record<string, OrnamentPathGenerator> = {
  embattled: wrapSimpleOrnamenter(embattled, true, true),
  "embattled-counter-embattled": wrapSimpleOrnamenter(embattled, true, false),
  engrailed: wrapSimpleOrnamenter(engrailed, false, false),
  indented: wrapSimpleOrnamenter(indented, true, false),
  wavy: wrapSimpleOrnamenter(wavy, true, false),
};

// #endregion

// #region VARIED
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
  for (let y = 0; y < (H / W) * count; y++) {
    for (let x = y % 2; x < count; x += 2) {
      d += path`
        M ${-W_2 + x * step}       ${-H_2 + y * step}
        L ${-W_2 + x * step}       ${-H_2 + (y + 1) * step}
        L ${-W_2 + (x + 1) * step} ${-H_2 + (y + 1) * step}
        L ${-W_2 + (x + 1) * step} ${-H_2 + y * step}
        Z
      `;
    }
  }
  return d;
}

function chevronny(count: number = 6) {
  const step = H / (count - 2);
  let d = "";
  // start from the bottom -- we always want to have one nice pointy chevron there
  for (let i = count - 1; i >= 0; i -= 2) {
    d += path`
      M       0 ${H_2 - i * step}
      l  ${W_2} ${W_2}
      l       0 ${step}
      L       0 ${H_2 - (i - 1) * step}
      l ${-W_2} ${W_2}
      l       0 ${-step}
      Z
    `;
  }
  return d;
}

function lozengy(count: number = 8) {
  // -1 because we have half of one on the left and half on the right, so we want a _slightly_
  // larger step to make sure we end up spanning the whole width
  const step = W / (count - 1);
  let d = "";
  for (let y = 0; y < (H / W) * count; y += 2) {
    for (let x = 0; x < count; x++) {
      d += path`
        M ${-W_2 + x * step}         ${-H_2 + y * step}
        L ${-W_2 + (x + 0.5) * step} ${-H_2 + (y + 1) * step}
        L ${-W_2 + x * step}         ${-H_2 + (y + 2) * step}
        L ${-W_2 + (x - 0.5) * step} ${-H_2 + (y + 1) * step}
        Z
      `;
    }
  }
  return d;
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

// #endregion

// #region HIGHER-ORDER ELEMENTS
// ----------------------------------------------------------------------------

const QUARTERINGS: Record<Quarter, { translate: Coordinate }> = {
  1: {
    translate: [-25, -30],
  },
  2: {
    translate: [25, -30],
  },
  3: {
    translate: [-25, 30],
  },
  4: {
    translate: [25, 30],
  },
};

const CANTON_SCALE_FACTOR = 1 / 3;
// Note that this clips the bottom of the area. Combined with proportional scaling, this permits us
// to render _most_ things pretty sanely, at the risk of them being slightly off-center or clipped
// since they expect to be rendered in a taller-than-wide rectangle by default.
const CANTON_PATH = path`
  M -${W_2} ${-H_2}
  L  ${W_2} ${-H_2}
  L  ${W_2} ${-H_2 + W}
  L -${W_2} ${-H_2 + W}
  Z
`;

function field(tincture: Tincture) {
  return svg.rect([-W_2, -H_2], [W_2, H_2], tincture);
}

function complexContent(container: SVGElement, content: ComplexContent) {
  function renderIntoParent(parent: SVGElement, element: SimpleContent) {
    if ("canton" in element) {
      const g = svg.g();
      applyTransforms(g, { origin: [-W_2, -H_2], scale: CANTON_SCALE_FACTOR });
      g.style.clipPath = `path("${CANTON_PATH}")`;
      g.appendChild(svg.path(CANTON_PATH, element.canton));
      g.classList.add(`fill-${element.canton}`);
      parent.appendChild(g);
      for (const c of element.content ?? []) {
        renderIntoParent(g, c);
      }
    } else if ("on" in element) {
      on(parent, element);
    } else if ("ordinary" in element) {
      parent.appendChild(ORDINARIES[element.ordinary](element));
    } else if ("charge" in element) {
      const locator = CHARGE_DIRECTIONS[element.direction ?? "none"];
      for (const [translate, scale] of locator.forCount(element.count)) {
        const rendered = renderCharge(element);
        applyTransforms(rendered, {
          translate,
          scale,
          rotate: Posture.toRadians(element.posture),
        });
        parent.appendChild(rendered);
      }
    } else {
      assertNever(element);
    }
  }

  function overwriteCounterchangedTincture(
    element: SimpleContent,
    tincture: Tincture
  ): SimpleContent {
    function maybeToCounterchanged<T extends Tincture | undefined>(t: T): T {
      return (t === Tincture.COUNTERCHANGED ? tincture : t) as T;
    }

    if ("canton" in element) {
      // Cantons cannot be counterchanged; they always have a background and everything on them is
      // relative to their background. Thus, nop.
    } else if ("on" in element) {
      if (element.surround?.tincture === Tincture.COUNTERCHANGED) {
        return {
          ...element,
          // Note that we do NOT overwrite the `charge` tincture. That's a function of the `on`, not the field.
          surround: { ...element.surround, tincture },
        };
      }
    } else if ("ordinary" in element) {
      return {
        ...element,
        tincture: maybeToCounterchanged(element.tincture),
        cotised: maybeToCounterchanged(element.cotised),
      };
    } else if ("charge" in element) {
      return {
        ...element,
        tincture: maybeToCounterchanged(element.tincture),
      };
    } else {
      assertNever(element);
    }

    return element;
  }

  if ("party" in content) {
    const { party } = ORDINARIES[content.party];
    // This should be prevented in grammar, so this should never fire.
    assert(party !== UNSUPPORTED, `cannot use 'party' with this ordinary`);
    const g1 = svg.g();
    g1.style.clipPath = `path("${path.from(party(content.ornament))}")`;
    const g2 = svg.g();
    g1.appendChild(field(content.first));
    g2.appendChild(field(content.second));
    // Add g2 first so that it's underneath g1, which has the only clip path.
    container.appendChild(g2);
    container.appendChild(g1);
    if (content.content != null) {
      const counterchangedFirst = overwriteCounterchangedTincture(
        content.content,
        content.first
      );
      // This branch is not just a perf/DOM optimization, but prevents visual artifacts. If we
      // unconditionally do the counterchanged thing, even when not necessary, the line of division
      // often leaks through any superimposed ordinaries as a thin line of off-color pixels since
      // those ordinaries are actually two compatible shapes, overlapping and clipped.
      //
      // This does not fix the artifact in the case where we do actually need to render something
      // counterchanged. A fuller fix would involve a lot more fiddling and masking to ensure we
      // always render a single ordinary, which I am not willing to do at the moment.
      if (!deepEqual(content.content, counterchangedFirst)) {
        const counterchangedSecond = overwriteCounterchangedTincture(
          content.content,
          content.second
        );
        renderIntoParent(g1, counterchangedSecond);
        renderIntoParent(g2, counterchangedFirst);
      } else {
        renderIntoParent(container, content.content);
      }
    }
  } else if ("quarters" in content) {
    const quartered: Record<Quarter, SVGElement> = {
      1: svg.g(),
      2: svg.g(),
      3: svg.g(),
      4: svg.g(),
    };

    for (const [i_, { translate }] of Object.entries(QUARTERINGS)) {
      const i = +i_ as any as Quarter;
      applyTransforms(quartered[i], { translate, scale: 0.5 });
      quartered[i].style.clipPath = path`path("
        M -${W_2} -${H_2}
        L  ${W_2} -${H_2}
        L  ${W_2}  ${H_2}
        L -${W_2}  ${H_2}
        Z
      ")`;
    }

    for (const quartering of content.quarters) {
      for (const quarter of quartering.quarters) {
        complexContent(quartered[quarter], quartering.content);
      }
    }

    for (const e of Object.values(quartered)) {
      container.appendChild(e);
    }

    let line = svg.line([0, -H_2], [0, H_2], Tincture.of("sable"), 0.5);
    line.setAttribute("vector-effect", "non-scaling-stroke");
    container.appendChild(line);
    line = svg.line([-W_2, 0], [W_2, 0], Tincture.of("sable"), 0.5);
    line.setAttribute("vector-effect", "non-scaling-stroke");
    container.appendChild(line);

    if (content.overall) {
      renderIntoParent(container, content.overall);
    }
  } else if ("varied" in content) {
    container.appendChild(field(content.first));
    const second = field(content.second);
    second.style.clipPath = `path("${VARIED[content.varied.type](
      content.varied.count
    )}")`;
    container.appendChild(second);
    for (const c of content.content ?? []) {
      renderIntoParent(container, c);
    }
  } else {
    container.appendChild(field(content.tincture));
    for (const c of content.content ?? []) {
      renderIntoParent(container, c);
    }
  }
}

function on(parent: SVGElement, { on, surround, charge }: On) {
  parent.appendChild(ORDINARIES[on.ordinary](on));

  if (charge != null) {
    assert(
      charge.direction == null,
      'cannot specify a direction for charges in "on"'
    );

    const locator = ORDINARIES[on.ordinary].on;
    for (const [translate, scale] of locator.forCount(charge.count)) {
      const c = renderCharge(charge);
      applyTransforms(c, {
        translate,
        scale,
        rotate: Posture.toRadians(charge.posture),
      });
      parent.appendChild(c);
    }
  }

  if (surround != null) {
    assert(
      surround.direction == null,
      'cannot specify a direction for charges in "between"'
    );

    const locator = ORDINARIES[on.ordinary].surround;
    for (const [translate, scale] of locator.forCount(surround.count)) {
      const c = renderCharge(surround);
      applyTransforms(c, {
        translate,
        scale,
        rotate: Posture.toRadians(surround.posture),
      });
      parent.appendChild(c);
    }
  }
}

// #endregion

// #region INITIALIZATION
// ----------------------------------------------------------------------------

function recursivelyOmitNullish<T>(value: T): T {
  assert(value != null, "cannot omit nullish root values");
  if (Array.isArray(value)) {
    return value.filter((e) => e != null).map(recursivelyOmitNullish) as T;
  } else if (typeof value === "object") {
    const o: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v != null) {
        o[k] = recursivelyOmitNullish(v);
      }
    }
    return o as T;
  } else {
    return value;
  }
}

let previousPrevEventHandler;
let previousNextEventHandler;
function parseAndRenderBlazon() {
  function render(parsed: ComplexContent): void {
    parsed = recursivelyOmitNullish(parsed);

    ast.innerHTML = JSON.stringify(parsed, null, 2);

    rendered.innerHTML = "";
    const outline = svg.path(FIELD_PATH, Tincture.NONE);
    outline.classList.add("stroke-sable");
    outline.setAttribute("stroke-width", "2");
    rendered.appendChild(outline);

    // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
    const container = svg.g();
    container.style.clipPath = `path("${FIELD_PATH}")`;
    rendered.appendChild(container);
    // Make sure there's always a default background.
    container.appendChild(field(Tincture.of("argent")));

    complexContent(container, parsed);
  }

  let results: ComplexContent[];
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(input.value.trim().toLowerCase());
    results = parser.results;
  } catch (e) {
    error.innerHTML = (e as any).toString();
    error.classList.remove("hidden");
    return;
  }

  if (results.length === 0) {
    error.classList.remove("hidden");
    error.innerHTML = "Unexpected end of input.";
  } else if (results.length > 1) {
    ambiguousPrev.removeEventListener("click", previousPrevEventHandler!);
    ambiguousNext.removeEventListener("click", previousNextEventHandler!);

    let which = 0;
    function step(sign: number) {
      which = (which + sign + results.length) % results.length;
      ambiguousCount.innerHTML = `${which + 1} / ${results.length}`;
      render(results[which]);
    }

    previousPrevEventHandler = () => step(-1);
    ambiguousPrev.addEventListener("click", previousPrevEventHandler);
    previousNextEventHandler = () => step(1);
    ambiguousNext.addEventListener("click", previousNextEventHandler);

    step(0);

    error.classList.add("hidden");
    ambiguous.classList.remove("hidden");
  } else {
    error.classList.add("hidden");
    ambiguous.classList.add("hidden");
    render(results[0]);
  }
}

const input: HTMLTextAreaElement = document.querySelector("#blazon-input")!;
const random: HTMLButtonElement = document.querySelector("#random-blazon")!;
const form: HTMLFormElement = document.querySelector("#form")!;
const rendered: SVGSVGElement = document.querySelector("#rendered")!;
const error: HTMLPreElement = document.querySelector("#error")!;
const ast: HTMLPreElement = document.querySelector("#ast")!;
const ambiguous: HTMLDivElement = document.querySelector("#ambiguous")!;
const ambiguousPrev: HTMLButtonElement = document.querySelector(
  "#ambiguous-previous"
)!;
const ambiguousNext: HTMLButtonElement =
  document.querySelector("#ambiguous-next")!;
const ambiguousCount: HTMLSpanElement =
  document.querySelector("#ambiguous-count")!;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  parseAndRenderBlazon();
});

const TINCTURES = [
  "argent",
  "azure",
  "gules",
  "or",
  "purpure",
  "sable",
  "vert",
];
// Gross and duplicative, but the entire grammar is written in lowercase and I don't want to
// sprinkle case-insensitive markers EVERYWHERE just so the tinctures can be generated with typical
// casing by the unparser.
const TINCTURE_REGEX = new RegExp(`(^| )(${TINCTURES.join("|")})( |\.$)`, "g");
random.addEventListener("click", () => {
  // 14 chosen empirically. Seems nice. Gets lions, where 12 does not.
  const blazon = Unparser(grammar, grammar.ParserStart, 14)
    // This is restatement of the regex rule for acceptable whitespace.
    .replaceAll(/[ \t\n\v\f,;]+/g, " ")
    .trim()
    .replace(/ ?\.?$/, ".")
    .replaceAll(
      // It's REALLY hard to generate a random blazon where counterchanged makes sense, since the
      // grammar does not express a relationship between the context ("party per") and the tincture.
      // Since it's 1/8th of the colors, just ban it to reduce nonsense blazons by a lot.
      /(^| )counterchanged( |\.$)/g,
      (_, prefix, suffix) =>
        `${prefix}${
          TINCTURES[Math.floor(Math.random() * TINCTURES.length)]
        }${suffix}`
    )
    .replaceAll(
      TINCTURE_REGEX,
      (_, prefix, tincture, suffix) =>
        `${prefix}${tincture[0].toUpperCase()}${tincture.slice(1)}${suffix}`
    )
    .replace(/^./, (l) => l.toUpperCase());
  input.value = blazon;
  parseAndRenderBlazon();
});

for (const example of document.querySelectorAll<HTMLAnchorElement>(
  "[data-example]"
)) {
  example.addEventListener("click", (e) => {
    e.preventDefault();
    const a = e.target as HTMLAnchorElement;
    input.value = a.dataset.example || a.innerHTML;
    parseAndRenderBlazon();
  });
}

// These files are small and there's not that many of them, so it's easier if we just eagerly
// load of these and then try to access them sync later and hope for the best. Making the ENTIRE
// implementation async just for this is a massive PITA.
fetchComplexSvg("lion", "rampant");

// This should happen last so that when the default text includes a complex SVG charge, at least
// the immediate failure to render doesn't cause us to skip the loading!
parseAndRenderBlazon();

// #endregion
