/*
TODO
-------------------------------------------------------------------------------
- party per treatment: quarterly
- Placement -- at least in the case of chevron and saltire, they are rotated to match
- things I want to be able to render
  - bavarian arms
    - [variation] in [placement]
- embattled ordinaries (chevron, cross counter-embattled) have visible little blips due to the commented-on hack
- textbox with word wrap so you can read it better
- lion passant probably should be a lot wiiiiider -- should charges be able to define special treatment for different counts?
- lion SVGs can be aggressively deduplicated -- 3 heads x 2 bodies
- still see artifacts from parting when there is a thing on top
  - Party per pale embattled-counter-embattled Gules and Azure a cross wavy Argent.
  - instead of rendering twice and modifying the tincture high-level, pass the mask/clip path (it
    will probably have to all become masks) down, along with a pair of colors, so any counterchanged
    element knows how to clip itself
  - alternately, what if this just switched to masks instead of clip paths? would it just work?
- does not work
  - paly gules and argent on a bend counterchanged three rondels sable
- allow multiple charges in party-per
- should cantons be counterchangeable?
  - then things on them are recurseively counterchanged in reverse?
    - this should already be true of counterchanged ordinaries in `on`
*/

/*
FUTURE WORK and KNOWN ISSUES
-------------------------------------------------------------------------------
- In general, more vocabulary (charges, ordinaries, postures, treatments, etc.) is always welcome.
- Tincture references ("of the first", "of the field", etc.) are not supported. Apparently they are
  generally disliked for introducing complexity and ambiguity.
- Charges `on` an ordinary are often too close; especially 2s and 3s, and more especially on chief
  and fess.
- Charges in quartered quadrants aren't pushed around to account for the curvature of the bottom of
  the arms; a proper rendering would make them more cramped rather than cut them off.
- Cantons are proportionally scaled and cropped at the bottom, which mostly works but can cause
  elements in them to appear off-center or clipped. Properly, some elements should get custom
  treatment for the square (rather than rectangular) field in a canton.
- Divided fields ("party per") should be allowed to contain "complex" content (such as other divided
  fields) and not just ordinaries and charges.
- "Party per cross" is not allowed, even though it's synonymous with "quarterly".
- The error messages are really hard to read. A lexer that properly groups characters into tokens
  would probably help (as right now every character in a literal is its own rule).
- A singular fret should extend to the corners of the containing field, but there's currently no
  facility to treat charges differently depending on their count. (Abstraction break?)
- It would be nice if the shield looked at least a little more realistic.
- There are plenty more charges/ordinaries (and their attitudes) to add!
- When several charges in a row have the same tincture, it is idiomatically only specified once at
  the end. The parser does not support that, instead requiring every charge to have a tincture
  specified.

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

const ESCUTCHEON_PATH = path`
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

type Tincture =
  | "argent"
  | "azure"
  | "gules"
  | "or"
  | "purpure"
  | "sable"
  | "vert"
  | "counterchanged";

type Treatment =
  | "embattled-counter-embattled"
  | "embattled"
  | "engrailed"
  | "indented"
  | "wavy";

type VariationName =
  | "barry bendy"
  | "barry"
  | "bendy"
  | "bendy sinister"
  | "checky"
  | "chevronny"
  | "fusilly"
  | "lozengy"
  | "paly";

type Posture = "palewise" | "fesswise" | "bendwise" | "bendwise sinister";

const Posture = {
  toRadians: (posture: Posture | undefined): number | undefined => {
    switch (posture) {
      case undefined:
        return undefined;
      case "palewise":
        return 0;
      case "fesswise":
        return -Math.PI / 2;
      case "bendwise":
        return -Math.PI / 4;
      case "bendwise sinister":
        return Math.PI / 4;
      default:
        assertNever(posture);
    }
  },
};

type Direction = "pale" | "fess" | "bend" | "chevron" | "saltire";
type Placement = Direction | "cross";
type Quarter = 1 | 2 | 3 | 4;

// Stupid name because Location is a DOM type.
type Location_ = "chief" | "base";
const Location_ = {
  toOffset: (location: Location_ | undefined): Coordinate => {
    const yOffset = -H_2 + W_2;

    switch (location) {
      case undefined:
        return [0, yOffset];
      case "base":
        return [0, yOffset + (H_2 + (H_2 - W_2)) / 2];
      case "chief":
        return [0, yOffset - W_2 / 2];
      default:
        assertNever(location);
    }
  },
};

interface Blazon {
  main: ComplexContent;
  inescutcheon?: Inescutcheon;
}

type ComplexContent = SimpleField | PartyPerField | Quarterly;
type SimpleContent = Ordinary | Charge | Canton | On;

type SimpleField =
  | {
      tincture: Tincture;
      content?: SimpleContent[];
    }
  | {
      variation: Variation;
      first: Tincture;
      second: Tincture;
      content?: SimpleContent[];
    };

interface Variation {
  type: VariationName;
  count?: number;
}

interface PartyPerField {
  party: Direction;
  first: Tincture;
  second: Tincture;
  content?: SimpleContent;
  treatment?: Treatment;
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
  treatment?: Treatment;
}

interface BaseCharge {
  count: Count;
  posture?: Posture;
  placement?: Placement;
}

interface SimpleCharge extends BaseCharge {
  charge: "mullet" | "rondel" | "fleur-de-lys" | "escallop" | "fret";
  tincture: Tincture;
}

interface LionCharge extends BaseCharge {
  charge: "lion";
  tincture: Tincture;
  armed: Tincture;
  langued: Tincture;
  attitude: string;
}

interface EscutcheonCharge extends BaseCharge {
  charge: "escutcheon";
  content: ComplexContent;
}

type Charge = SimpleCharge | LionCharge | EscutcheonCharge;

interface Canton {
  canton: Tincture;
  content?: SimpleContent[];
}

interface On {
  on: Ordinary;
  surround?: Charge;
  charge?: Charge;
}

interface Inescutcheon {
  content: ComplexContent;
  location?: Location_;
}

interface OrdinaryRenderer {
  (ordinary: Ordinary): SVGElement;
  on: ParametricLocator;
  between: ParametricLocator;
  // I'd use non-?-optional `undefined` to mean unsupported, but the compiler complains about
  // implicit `any` if I try that.
  party:
    | ((treatment: Treatment | undefined) => PathCommand.Any[])
    | Unsupported;
}

interface ChargeRenderer<T extends Charge> {
  (charge: T): SVGElement | Promise<SVGElement>;
}

interface VariationPatternGenerator {
  (count?: number): SVGPatternElement;
}

type RelativeTreatmentPath = [
  PathCommand.m,
  PathCommand.Relative[],
  PathCommand.m
];

const RelativeTreatmentPath = {
  rotate: (
    [start, main, end]: RelativeTreatmentPath,
    radians: number
  ): void => {
    PathCommand.rotate(start, radians);
    main.forEach((c) => PathCommand.rotate(c, radians));
    PathCommand.rotate(end, radians);
  },
};

interface TreatmentPathGenerator {
  (
    // If negative, assumed to go right-to-left instead of left-to-right.
    xLength: number,
    invertY: boolean,
    // This is only for 'embattled'. It has special rules that means it should only render on the
    // _top_ of ordinaries. "Primary" means top.
    side: "primary" | "secondary",
    alignment?: "start" | "end" | "center"
  ): RelativeTreatmentPath;
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

  export function toDString(commands: PathCommand.Any[]): string {
    return commands
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
  }

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
    0.8,
    0.8,
    0.6,
    0.6,
    0.6,
    0.6,
    0.6,
    0.6,
    0.5,
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

let idCounter = 1;
function uniqueId(prefix: string = "id"): string {
  return `${prefix}-${idCounter++}`;
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
    const oneKeys = Object.getOwnPropertyNames(one).sort();
    const twoKeys = Object.getOwnPropertyNames(two).sort();
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
  path: (
    d: string | PathCommand.Any[],
    {
      stroke,
      strokeWidth = 1,
      strokeLinecap = "butt",
      classes,
    }: {
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: "butt" | "round" | "square";
      classes?: { fill?: Tincture; stroke?: Tincture };
    } = {}
  ): SVGPathElement => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (Array.isArray(d)) {
      d = PathCommand.toDString(d);
    }
    path.setAttribute("d", d);
    path.setAttribute("stroke-width", strokeWidth.toString());
    path.setAttribute("stroke-linecap", strokeLinecap);
    if (stroke != null) {
      path.setAttribute("stroke", stroke);
    }
    if (classes?.fill != null) {
      path.classList.add(`fill-${classes.fill}`);
    }
    if (classes?.stroke != null) {
      path.classList.add(`stroke-${classes.stroke}`);
    }
    return path;
  },
  line: (
    [x1, y1]: Coordinate,
    [x2, y2]: Coordinate,
    {
      stroke,
      strokeWidth = 1,
      strokeLinecap = "butt",
      classes,
    }: {
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: "butt" | "round" | "square";
      classes?: {
        stroke?: Tincture;
      };
    } = {}
  ): SVGLineElement => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toString());
    line.setAttribute("y1", y1.toString());
    line.setAttribute("x2", x2.toString());
    line.setAttribute("y2", y2.toString());
    line.setAttribute("stroke-width", strokeWidth.toString());
    line.setAttribute("stroke-linecap", strokeLinecap);
    if (stroke != null) {
      line.setAttribute("stroke", stroke);
    }
    if (classes?.stroke != null) {
      line.classList.add(`stroke-${classes.stroke}`);
    }
    return line;
  },
  rect: (
    [x1, y1]: Coordinate,
    [x2, y2]: Coordinate,
    {
      fill,
      stroke,
      classes,
    }: { fill?: string; stroke?: string; classes?: { fill?: Tincture } } = {}
  ): SVGRectElement => {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", `${x1}`);
    rect.setAttribute("y", `${y1}`);
    rect.setAttribute("width", `${x2 - x1}`);
    rect.setAttribute("height", `${y2 - y1}`);
    if (fill != null) {
      rect.setAttribute("fill", fill);
    }
    if (stroke != null) {
      rect.setAttribute("stroke", stroke);
    }
    if (classes?.fill != null) {
      rect.classList.add(`fill-${classes.fill}`);
    }
    return rect;
  },
  g: (...children: SVGElement[]): SVGGElement => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.append(...children);
    return g;
  },
  pattern: (
    {
      viewBox,
      x = 0,
      y = 0,
      width,
      height,
      preserveAspectRatio,
      patternTransform,
    }: {
      viewBox: [Coordinate, Coordinate];
      x?: number;
      y?: number;
      width: number;
      height: number;
      preserveAspectRatio?: string;
      patternTransform?: { rotate?: number };
    },
    ...children: SVGElement[]
  ): SVGPatternElement => {
    const pattern = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "pattern"
    );

    // Make sure that the coordinate system is the same as the referent, rather than some kind of
    // scaling. This is what we always want in this project.
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute(
      "viewBox",
      `${viewBox[0][0]} ${viewBox[0][1]} ${viewBox[1][0]} ${viewBox[1][1]}`
    );
    // W/H offsets so that we start in the top-left corner.
    pattern.setAttribute("x", x.toString());
    pattern.setAttribute("y", y.toString());
    // Tiling size.
    pattern.setAttribute("width", width.toString());
    pattern.setAttribute("height", height.toString());

    if (preserveAspectRatio != null) {
      pattern.setAttribute("preserveAspectRatio", preserveAspectRatio);
    }

    if (patternTransform?.rotate != null) {
      pattern.setAttribute(
        "patternTransform",
        `rotate(${(patternTransform.rotate / (2 * Math.PI)) * 360})`
      );
    }

    pattern.append(...children);

    return pattern;
  },
  polygon: ({
    points,
    fill,
    stroke,
  }: {
    points: Coordinate[];
    fill?: string;
    stroke?: string;
  }): SVGPolygonElement => {
    const polygon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polygon"
    );
    polygon.setAttribute(
      "points",
      points.map(([x, y]) => `${x},${y}`).join(" ")
    );
    if (fill != null) {
      polygon.setAttribute("fill", fill);
    }
    if (stroke != null) {
      polygon.setAttribute("stroke", stroke);
    }
    return polygon;
  },
  mask: (
    { id }: { id?: string },
    ...children: SVGElement[]
  ): SVGMaskElement => {
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    if (id != null) {
      mask.id = id;
    }
    mask.append(...children);
    return mask;
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

const complexSvgCache: Record<string, SVGElement> = {};
async function fetchComplexSvg(
  kind: string,
  variant?: string
): Promise<SVGElement> {
  const key = variant ? `${kind}-${variant}` : kind;
  if (!(key in complexSvgCache)) {
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

  return complexSvgCache[key];
}

// #endregion

// #region ORDINARIES
// ----------------------------------------------------------------------------

const COTISED_WIDTH = W_2 / 12;

const BEND_WIDTH = W / 3;
// Make sure it's long enough to reach diagonally!
const BEND_LENGTH = Math.hypot(W, W) + BEND_WIDTH / 2;
function bend({ tincture, cotised, treatment }: Ordinary) {
  const bend = svg.g();

  if (treatment != null) {
    bend.appendChild(
      svg.path(
        relativePathsToClosedLoop(
          relativePathFor([0, -BEND_WIDTH / 2], undefined, undefined),
          TREATMENTS[treatment](BEND_LENGTH, false, "primary"),
          relativePathFor(undefined, [0, BEND_WIDTH], undefined),
          // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
          // we traverse around the bend clockwise.
          TREATMENTS[treatment](-BEND_LENGTH, true, "secondary", "end")
        ),
        { classes: { fill: tincture } }
      )
    );
  } else {
    bend.appendChild(
      svg.line([0, 0], [BEND_LENGTH, 0], {
        strokeWidth: BEND_WIDTH,
        classes: { stroke: tincture },
      })
    );
  }

  if (cotised != null) {
    const offset = BEND_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
    bend.appendChild(
      svg.line([0, -offset], [BEND_LENGTH, -offset], {
        strokeWidth: COTISED_WIDTH,
        classes: { stroke: cotised },
      })
    );
    bend.appendChild(
      svg.line([0, offset], [BEND_LENGTH, offset], {
        strokeWidth: COTISED_WIDTH,
        classes: { stroke: cotised },
      })
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

bend.between = new AlternatingReflectiveLocator(
  new ExhaustiveLocator(
    [
      [
        [W_2 - 24, -H_2 + 24], //
      ],
      [
        [W_2 - 32, -H_2 + 12], //
        [W_2 - 12, -H_2 + 32],
      ],
      [
        [W_2 - 15, -H_2 + 15], //
        [W_2 - 35, -H_2 + 15],
        [W_2 - 15, -H_2 + 35],
      ],
    ],
    [0.7, 0.5, 0.4]
  ),
  [-W_2, -H_2],
  [W_2, -H_2 + W]
);

bend.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const topLeft: Coordinate = [-W_2, -H_2];
  const topRight: Coordinate = [W_2, -H_2];
  const bottomRight = Coordinate.add(topLeft, [BEND_LENGTH, BEND_LENGTH]);
  if (treatment == null) {
    return [
      { type: "M", loc: topLeft },
      { type: "L", loc: bottomRight },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  } else {
    const treatmentPath = TREATMENTS[treatment](
      BEND_LENGTH,
      false,
      "primary",
      "start"
    );
    RelativeTreatmentPath.rotate(treatmentPath, Math.PI / 4);
    return [
      { type: "M", loc: topLeft },
      { type: "l", loc: treatmentPath[0].loc },
      ...treatmentPath[1],
      { type: "l", loc: treatmentPath[2].loc },
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

bendSinister.on = new ReflectiveLocator(bend.on, [0, -H_2], [0, H_2]);

bendSinister.between = new ReflectiveLocator(bend.between, [0, -H_2], [0, H_2]);

bendSinister.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const commands = bend.party(treatment);
  commands.forEach(PathCommand.negateX);
  return commands;
};

const CHIEF_WIDTH = H / 3;
function chief({ tincture, cotised, treatment }: Ordinary) {
  const chief = svg.g();

  if (treatment != null) {
    const [start, main, end] = TREATMENTS[treatment](
      -W,
      true,
      "primary",
      "center"
    );
    chief.appendChild(
      svg.path(
        [
          { type: "M", loc: [-W_2, -H_2] },
          { type: "L", loc: [W_2, -H_2] },
          { type: "l", loc: Coordinate.add([0, CHIEF_WIDTH], start.loc) },
          ...main,
          { type: "l", loc: Coordinate.add([0, -CHIEF_WIDTH], end.loc) },
        ],
        { classes: { fill: tincture } }
      )
    );
  } else {
    chief.appendChild(
      svg.line([-W_2, -H_2 + CHIEF_WIDTH / 2], [W_2, -H_2 + CHIEF_WIDTH / 2], {
        strokeWidth: CHIEF_WIDTH,
        classes: { stroke: tincture },
      })
    );
  }

  if (cotised != null) {
    chief.append(
      svg.line(
        [-W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2],
        [W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2],
        { strokeWidth: COTISED_WIDTH, classes: { stroke: cotised } }
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

chief.between = new NullLocator();

chief.party = UNSUPPORTED;

const CHEVRON_WIDTH = W / 4;

function chevron({ tincture, cotised, treatment }: Ordinary) {
  const left: Coordinate = [-W_2, -H_2 + W];
  const right: Coordinate = [-W_2 + H, H_2];
  // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
  const mid: Coordinate = [0, -(H_2 - W_2)];

  const chevron = svg.g();

  if (treatment != null) {
    const topLength = Coordinate.length(mid, right) + CHEVRON_WIDTH / 2;
    const bottomLength = Coordinate.length(mid, right) - CHEVRON_WIDTH / 2;
    for (const sign of [-1, 1]) {
      const [topStart, topMain, topEnd] = TREATMENTS[treatment](
        topLength,
        false,
        "primary",
        "start"
      );
      const [bottomStart, bottomMain, bottomEnd] = TREATMENTS[treatment](
        -bottomLength,
        true,
        "secondary",
        "end"
      );

      const p = svg.path(
        [
          { type: "m", loc: topStart.loc },
          ...topMain,
          {
            type: "l",
            loc: Coordinate.add(
              topEnd.loc,
              [0, CHEVRON_WIDTH],
              bottomStart.loc
            ),
          },
          ...bottomMain,
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
          { type: "z" },
        ],
        { classes: { fill: tincture } }
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
    chevron.appendChild(
      svg.line(left, mid, {
        strokeWidth: CHEVRON_WIDTH,
        strokeLinecap: "square",
        classes: { stroke: tincture },
      })
    );
    chevron.appendChild(
      svg.line(mid, right, {
        strokeWidth: CHEVRON_WIDTH,
        strokeLinecap: "square",
        classes: { stroke: tincture },
      })
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
            {
              strokeWidth: COTISED_WIDTH,
              strokeLinecap: "square",
              classes: { stroke: cotised },
            }
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

chevron.between = new ExhaustiveLocator(
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

chevron.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const [topLeft, midLeft, mid, midRight, topRight] = [
    [-W_2, -H_2],
    // See the main renderer for how these values are picked.
    [-W_2, -H_2 + W],
    [0, -(H_2 - W_2)],
    [W_2, -H_2 + W],
    [W_2, -H_2],
  ] satisfies Coordinate[];

  if (treatment == null) {
    return [
      { type: "M", loc: topLeft },
      { type: "L", loc: midLeft },
      { type: "L", loc: mid },
      { type: "L", loc: midRight },
      { type: "L", loc: topRight },
      { type: "Z" },
    ];
  } else {
    const [leftStart, leftMain, leftEnd] = TREATMENTS[treatment](
      Coordinate.length(midLeft, mid),
      false,
      "primary",
      "end"
    );
    const [rightStart, rightMain, rightEnd] = TREATMENTS[treatment](
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

function cross({ tincture, cotised, treatment }: Ordinary) {
  const top: Coordinate = [0, -H_2];
  const bottom: Coordinate = [0, H_2];
  const left: Coordinate = [-W_2, -CROSS_VERTICAL_OFFSET];
  const right: Coordinate = [W_2, -CROSS_VERTICAL_OFFSET];

  const cross = svg.g();

  if (treatment != null) {
    const g = svg.g();

    const hLength = W_2 - CROSS_WIDTH / 2;
    const vLength = H_2 - CROSS_WIDTH / 2 + CROSS_VERTICAL_OFFSET;

    const treatments = [
      // Starting on the bottom right, moving around counter-clockwise.
      TREATMENTS[treatment](-vLength, false, "secondary", "end"),
      TREATMENTS[treatment](hLength, true, "secondary", "start"),
      straightLineTreatment(-CROSS_WIDTH),
      TREATMENTS[treatment](-hLength, false, "primary", "end"),
      TREATMENTS[treatment](-vLength, false, "secondary", "start"),
      straightLineTreatment(-CROSS_WIDTH),
      TREATMENTS[treatment](vLength, true, "secondary", "end"),
      TREATMENTS[treatment](-hLength, false, "primary", "start"),
      straightLineTreatment(CROSS_WIDTH),
      TREATMENTS[treatment](hLength, true, "secondary", "end"),
      TREATMENTS[treatment](vLength, true, "secondary", "start"),
    ];

    for (const index of [0, 2, 4, 6, 8, 10]) {
      RelativeTreatmentPath.rotate(treatments[index], Math.PI / 2);
    }

    g.appendChild(
      svg.path(relativePathsToClosedLoop(...treatments), {
        classes: { fill: tincture },
      })
    );

    applyTransforms(g, {
      // I _think_ this is the correct offset: the vertical offset is accounted for by being
      // included in the vertical length, and even though the first treatment can vary in length
      // depending on the type, the end-alignment means that it'll grow downwards, out of view.
      translate: [CROSS_WIDTH / 2, H_2],
    });

    cross.appendChild(g);
  } else {
    cross.appendChild(
      svg.line(top, bottom, {
        strokeWidth: CROSS_WIDTH,
        classes: { stroke: tincture },
      })
    );
    cross.appendChild(
      svg.line(left, right, {
        strokeWidth: CROSS_WIDTH,
        classes: { stroke: tincture },
      })
    );
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
          {
            strokeWidth: COTISED_WIDTH,
            strokeLinecap: "square",
            classes: { stroke: cotised },
          }
        )
      );
      cross.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x2sign, offset * y2sign]),
          Coordinate.add(mid, [offset * x2sign, offset * y2sign]),
          {
            strokeWidth: COTISED_WIDTH,
            strokeLinecap: "square",
            classes: { stroke: cotised },
          }
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

cross.between = new SequenceLocator(
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
function fess({ tincture, cotised, treatment }: Ordinary) {
  const fess = svg.g();

  if (treatment != null) {
    fess.appendChild(
      svg.path(
        [
          {
            type: "m",
            loc: [-W_2, FESS_VERTICAL_OFFSET - FESS_WIDTH / 2],
          },
          ...relativePathsToClosedLoop(
            TREATMENTS[treatment](W, false, "primary", "center"),
            [
              { type: "m", loc: [0, 0] },
              [{ type: "l", loc: [0, FESS_WIDTH] }],
              { type: "m", loc: [0, 0] },
            ],
            TREATMENTS[treatment](-W, true, "secondary", "center")
          ),
        ],
        { classes: { fill: tincture } }
      )
    );
  } else {
    fess.appendChild(
      svg.line([-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET], {
        strokeWidth: FESS_WIDTH,
        classes: { stroke: tincture },
      })
    );
  }

  if (cotised != null) {
    const offset = FESS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;

    fess.appendChild(
      svg.line(
        [-W_2, FESS_VERTICAL_OFFSET - offset],
        [W_2, FESS_VERTICAL_OFFSET - offset],
        { strokeWidth: COTISED_WIDTH, classes: { stroke: cotised } }
      )
    );
    fess.appendChild(
      svg.line(
        [-W_2, FESS_VERTICAL_OFFSET + offset],
        [W_2, FESS_VERTICAL_OFFSET + offset],
        { strokeWidth: COTISED_WIDTH, classes: { stroke: cotised } }
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

fess.between = new AlternatingReflectiveLocator(
  new LineSegmentLocator(
    [-W_2, -H_2 + FESS_WIDTH / 2],
    [W_2, -H_2 + FESS_WIDTH / 2],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [-W_2, FESS_VERTICAL_OFFSET],
  [W_2, FESS_VERTICAL_OFFSET]
);

fess.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const [topLeft, midLeft, midRight, topRight] = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "L", loc: [-W_2, -H / 10] },
    { type: "L", loc: [W_2, -H / 10] },
    { type: "L", loc: [W_2, -H_2] },
  ] satisfies PathCommand.Any[];

  if (treatment == null) {
    return [topLeft, midLeft, midRight, topRight, { type: "Z" }];
  } else {
    const [start, main, end] = TREATMENTS[treatment](
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
function pale({ tincture, cotised, treatment }: Ordinary) {
  const pale = svg.g();

  if (treatment != null) {
    const p = svg.path(
      relativePathsToClosedLoop(
        relativePathFor([0, -PALE_WIDTH / 2], undefined, undefined),
        TREATMENTS[treatment](H, false, "primary"),
        relativePathFor(undefined, [0, PALE_WIDTH], undefined),
        // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
        // we traverse around the pale clockwise.
        TREATMENTS[treatment](-H, true, "secondary", "end")
      ),
      { classes: { fill: tincture } }
    );
    applyTransforms(p, {
      translate: [0, -H_2],
      rotate: Math.PI / 2,
    });
    pale.appendChild(p);
  } else {
    pale.appendChild(
      svg.line([0, -H_2], [0, H_2], {
        strokeWidth: PALE_WIDTH,
        classes: { stroke: tincture },
      })
    );
  }

  if (cotised != null) {
    const offset = PALE_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;

    pale.appendChild(
      svg.line([offset, -H_2], [offset, H_2], {
        strokeWidth: COTISED_WIDTH,
        classes: { stroke: cotised },
      })
    );
    pale.appendChild(
      svg.line([-offset, -H_2], [-offset, H_2], {
        strokeWidth: COTISED_WIDTH,
        classes: { stroke: cotised },
      })
    );
  }

  return pale;
}

pale.on = new LineSegmentLocator(
  [0, -H_2],
  [0, H_2],
  [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]
);

pale.between = new AlternatingReflectiveLocator(
  new LineSegmentLocator(
    [-W_2 + PALE_WIDTH / 2, -H_2],
    [-W_2 + PALE_WIDTH / 2, H_2],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [0, -H_2],
  [0, H_2]
);

pale.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const [topLeft, topMid, bottomMid, bottomLeft] = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "L", loc: [0, -H_2] },
    { type: "L", loc: [0, H_2] },
    { type: "L", loc: [-W_2, H_2] },
  ] satisfies PathCommand.Any[];

  if (treatment == null) {
    return [topLeft, topMid, bottomMid, bottomLeft, { type: "Z" }];
  } else {
    const [start, main, end] = TREATMENTS[treatment](
      H,
      false,
      "primary",
      "start"
    );
    RelativeTreatmentPath.rotate([start, main, end], Math.PI / 2);
    return [
      topLeft,
      topMid,
      { type: "l", loc: start.loc },
      ...main,
      { type: "l", loc: end.loc },
      bottomMid,
      bottomLeft,
      { type: "Z" },
    ];
  }
};

const SALTIRE_WIDTH = W / 4;
function saltire({ tincture, cotised, treatment }: Ordinary) {
  const tl: Coordinate = [-W_2, -H_2];
  const tr: Coordinate = [W_2, -H_2];
  const bl: Coordinate = [W_2 - H, H_2];
  const br: Coordinate = [-W_2 + H, H_2];

  const saltire = svg.g();

  if (treatment != null) {
    const g = svg.g();

    const length = Math.hypot(W_2, W_2);

    const treatments = [
      // Starting on the bottom left, moving around clockwise.
      TREATMENTS[treatment](length, false, "primary", "end"),
      TREATMENTS[treatment](length, false, "secondary", "start"),
      straightLineTreatment(SALTIRE_WIDTH),
      TREATMENTS[treatment](-length, true, "primary", "end"),
      TREATMENTS[treatment](length, false, "primary", "start"),
      straightLineTreatment(-SALTIRE_WIDTH),
      TREATMENTS[treatment](-length, true, "secondary", "end"),
      TREATMENTS[treatment](-length, true, "primary", "start"),
      straightLineTreatment(-SALTIRE_WIDTH),
      TREATMENTS[treatment](length, false, "secondary", "end"),
      TREATMENTS[treatment](-length, true, "secondary", "start"),
    ];

    for (const index of [1, 3, 5, 7, 9]) {
      RelativeTreatmentPath.rotate(treatments[index], -Math.PI / 2);
    }

    const saltirePath = svg.path(relativePathsToClosedLoop(...treatments), {
      classes: { fill: tincture },
    });

    applyTransforms(saltirePath, {
      translate: [
        -(length + SALTIRE_WIDTH / 2),
        -H_2 - SALTIRE_WIDTH / 2 + W_2,
      ],
    });
    applyTransforms(g, {
      rotate: -Math.PI / 4,
      origin: [0, -H_2 + W_2],
    });

    g.appendChild(saltirePath);
    saltire.appendChild(g);
  } else {
    saltire.appendChild(
      svg.line(tl, br, {
        strokeWidth: SALTIRE_WIDTH,
        classes: { stroke: tincture },
      })
    );
    saltire.appendChild(
      svg.line(bl, tr, {
        strokeWidth: SALTIRE_WIDTH,
        classes: { stroke: tincture },
      })
    );
  }

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
          {
            strokeWidth: COTISED_WIDTH,
            strokeLinecap: "square",
            classes: { stroke: cotised },
          }
        )
      );
      saltire.appendChild(
        svg.line(
          Coordinate.add(p, [offset * x2sign, offset * y2sign]),
          Coordinate.add(mid, [offset * x2sign, offset * y2sign]),
          {
            strokeWidth: COTISED_WIDTH,
            strokeLinecap: "square",
            classes: { stroke: cotised },
          }
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

saltire.between = new SequenceLocator(
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

saltire.party = (treatment: Treatment | undefined): PathCommand.Any[] => {
  const [topLeft, topRight, bottomLeft, bottomRight] = [
    { type: "L", loc: [-W_2, -H_2] },
    { type: "L", loc: [W_2, -H_2] },
    { type: "L", loc: [-W_2, -H_2 + W] },
    { type: "L", loc: [W_2, -H_2 + W] },
  ] satisfies PathCommand.Any[];

  if (treatment == null) {
    // The ordering of this is significant, since it defines which tincture is on the top/bottom
    // versus left/right.
    return [
      { type: "M", loc: topLeft.loc },
      topRight,
      bottomLeft,
      // These two are to make the clip path reaches the bottom of the taller-than-wide shield.
      { type: "l", loc: [0, H - W] },
      { type: "l", loc: [W, 0] },
      bottomRight,
      { type: "Z" },
    ];
  } else {
    const [start1, main1, end1] = TREATMENTS[treatment](
      Math.hypot(W, W),
      true,
      "primary",
      "center"
    );
    RelativeTreatmentPath.rotate([start1, main1, end1], (3 * Math.PI) / 4);

    const [start2, main2, end2] = TREATMENTS[treatment](
      Math.hypot(W, W),
      true,
      "primary",
      "center"
    );
    RelativeTreatmentPath.rotate([start2, main2, end2], -(3 * Math.PI) / 4);

    return [
      { type: "M", loc: topLeft.loc },
      topRight,
      { type: "l", loc: start1.loc },
      ...main1,
      { type: "l", loc: end1.loc },
      bottomLeft,
      // These two are to make the clip path reaches the bottom of the taller-than-wide shield.
      { type: "l", loc: [0, H - W] },
      { type: "l", loc: [W, 0] },
      bottomRight,
      { type: "l", loc: start2.loc },
      ...main2,
      { type: "l", loc: end2.loc },
      { type: "Z" },
    ];
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
  // Not quite the full 40x40. Since these are the more visually heavyweight and fill out their
  // allotted space entirely without natural negative spaces, shrink them so they don't crowd too much.
  circle.setAttribute("r", "18");
  circle.setAttribute("cx", "0");
  circle.setAttribute("cy", "0");
  circle.classList.add(`fill-${tincture}`);
  return circle;
}

function mullet({ tincture }: SimpleCharge) {
  return svg.path(
    // These awkward numbers keep the proportions nice while just filling out a 40x40 square.
    "M 0 -18.8 L 5 -4.6 L 20 -4.6 L 8.4 4.5 L 12.5 18.8 L 0 10.4 L -12.5 18.8 L -8.4 4.5 L -20 -4.6 L -5 -4.6 Z",
    { classes: { fill: tincture } }
  );
}

const FRET_WIDTH = 40;
function fret({ tincture }: SimpleCharge) {
  const halfWidth = FRET_WIDTH / 2;
  const thirdWidth = FRET_WIDTH / 3;

  const strokeWidth = 3;
  const outlineWidth = 0.25;

  // This is kind of un-DRY, but this is the best way I determined to do this, when you account for
  // having to duplicate-with-slight-modifications the various elements. A single path almost works,
  // but would still require patching-up of the outline to produce the proper visual layering, and
  // doesn't have a good way to make sure the open ends in the four corners also have an outline.
  return svg.g(
    svg.line(
      [-halfWidth - outlineWidth, -halfWidth - outlineWidth],
      [halfWidth + outlineWidth, halfWidth + outlineWidth],
      {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
      }
    ),
    svg.line([-halfWidth, -halfWidth], [halfWidth, halfWidth], {
      strokeWidth,
      classes: { stroke: tincture },
    }),
    svg.path(
      `
      M ${-thirdWidth} 0
      L 0 ${-thirdWidth}
      L ${thirdWidth} 0
      L 0 ${thirdWidth}
      Z
      `,
      {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
      }
    ),
    svg.path(
      `
      M ${-thirdWidth} 0
      L 0 ${-thirdWidth}
      L ${thirdWidth} 0
      L 0 ${thirdWidth}
      Z
      `,
      { strokeWidth: strokeWidth, classes: { stroke: tincture } }
    ),
    svg.line(
      [-halfWidth - outlineWidth, halfWidth + outlineWidth],
      [halfWidth + outlineWidth, -halfWidth - outlineWidth],
      {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
      }
    ),
    svg.line([-halfWidth, halfWidth], [halfWidth, -halfWidth], {
      strokeWidth,
      classes: { stroke: tincture },
    }),
    // Patch up the first line to have it appear over the last one, as is the style.
    svg.line([-strokeWidth, -strokeWidth], [strokeWidth, strokeWidth], {
      strokeWidth: strokeWidth + 0.5,
      classes: { stroke: "sable" },
    }),
    svg.line(
      // Bump this out to be longer so that it doesn't produce visual artifacts.
      [-strokeWidth - 1, -strokeWidth - 1],
      [strokeWidth + 1, strokeWidth + 1],
      {
        strokeWidth,
        classes: { stroke: tincture },
      }
    )
  );
}

async function escallop({ tincture }: SimpleCharge) {
  const escallop = (await fetchComplexSvg("escallop")).cloneNode(true);
  escallop.classList.add(tincture);
  return escallop;
}

async function fleurDeLys({ tincture }: SimpleCharge) {
  const fleurDeLys = (await fetchComplexSvg("fleur-de-lys")).cloneNode(true);
  fleurDeLys.classList.add(tincture);
  return fleurDeLys;
}

// The lion SVGs are pulled from https://en.wikipedia.org/wiki/Attitude_(heraldry).
async function lion({ tincture, armed, langued, attitude }: LionCharge) {
  const lion = (await fetchComplexSvg("lion", attitude)).cloneNode(true);
  lion.classList.add(tincture);
  lion.classList.add(`armed-${armed}`);
  lion.classList.add(`langued-${langued}`);
  return lion;
}

async function escutcheon({ content }: EscutcheonCharge) {
  const escutcheon = svg.g(
    field("argent"),
    ...(await complexContent(content)),
    svg.path(ESCUTCHEON_PATH, { strokeWidth: 2, classes: { stroke: "sable" } })
  );
  escutcheon.setAttribute("clip-path", `path("${ESCUTCHEON_PATH}")`);
  applyTransforms(escutcheon, {
    scale: 0.35,
  });
  // Charges are scaled according to count and placement, so wrap in an extra layer in order to
  // apply our own scaling.
  return svg.g(escutcheon);
}

const CHARGE_LOCATORS: Record<Placement | "none", ParametricLocator> = {
  // The vertical offset here matches the offset for both quarterings and some of the ordinaries
  // (cross, saltire, etc.) so that they all stack neatly vertically over the center.
  none: new DefaultChargeLocator([-W_2, W_2], [-H_2, -H_2 + W]),
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
} = { rondel, mullet, fret, escallop, "fleur-de-lys": fleurDeLys };

// A little unfortunate this dispatching wrapper is necessary, but it's the only way to type-safety
// render based on the string. Throwing all charges, simple and otherwise, into a constant mapping
// together means the inferred type of the function has `never` as the first argument. :(
async function renderCharge(charge: Charge): Promise<SVGElement> {
  switch (charge.charge) {
    case "rondel":
    case "mullet":
    case "fleur-de-lys":
    case "escallop":
    case "fret":
      return SIMPLE_CHARGES[charge.charge](charge);
    case "lion":
      return lion(charge);
    case "escutcheon":
      return escutcheon(charge);
    default:
      assertNever(charge);
  }
}

// #endregion

// #region TREATMENTS
// ----------------------------------------------------------------------------

function wrapSimpleTreatment(
  treatment: (length: number) => RelativeTreatmentPath,
  isPatternCycleComposite: boolean,
  onlyRenderPrimary: boolean
): TreatmentPathGenerator {
  function mutatinglyApplyTransforms(
    [start, main, end]: RelativeTreatmentPath,
    {
      invertX = false,
      invertY = false,
      alignToEnd = false,
    }: {
      invertX?: boolean;
      invertY?: boolean;
      alignToEnd?: boolean;
    }
  ): RelativeTreatmentPath {
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
    const chosenTreatment =
      side !== "primary" && onlyRenderPrimary
        ? straightLineTreatment
        : treatment;

    const invertX = xLength < 0;
    const length = Math.abs(xLength);
    if (alignment === "start") {
      return mutatinglyApplyTransforms(chosenTreatment(length), {
        invertX,
        invertY,
      });
    } else if (alignment === "end") {
      return mutatinglyApplyTransforms(chosenTreatment(length), {
        invertX,
        invertY,
        alignToEnd: true,
      });
    } else if (alignment === "center") {
      const [start, firstMain] = mutatinglyApplyTransforms(
        chosenTreatment(length / 2),
        { alignToEnd: true }
      );

      const [, secondMain, end] = chosenTreatment(length / 2);
      return mutatinglyApplyTransforms(
        [start, [...firstMain, ...secondMain], end],
        { invertX, invertY }
      );
    } else {
      assertNever(alignment);
    }
  };
}

function relativePathFor(
  start: Coordinate | undefined,
  main: Coordinate | undefined,
  end: Coordinate | undefined
): RelativeTreatmentPath {
  return [
    { type: "m", loc: start ?? [0, 0] },
    main ? [{ type: "l", loc: main }] : [],
    { type: "m", loc: end ?? [0, 0] },
  ];
}

function relativePathsToClosedLoop(
  ...paths: RelativeTreatmentPath[]
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
  ...paths: RelativeTreatmentPath[]
): PathCommand.Relative[] => {
  return paths.flat(2).map((c) => (c.type === "m" ? { ...c, type: "l" } : c));
};

function straightLineTreatment(length: number): RelativeTreatmentPath {
  return [
    { type: "m", loc: [0, 0] },
    [{ type: "l", loc: [length, 0] }],
    { type: "m", loc: [0, 0] },
  ];
}

function embattled(length: number): RelativeTreatmentPath {
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

function engrailed(length: number): RelativeTreatmentPath {
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

function indented(length: number): RelativeTreatmentPath {
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

function wavy(length: number): RelativeTreatmentPath {
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

const TREATMENTS: Record<Treatment, TreatmentPathGenerator> = {
  "embattled-counter-embattled": wrapSimpleTreatment(embattled, true, false),
  embattled: wrapSimpleTreatment(embattled, true, true),
  engrailed: wrapSimpleTreatment(engrailed, false, false),
  indented: wrapSimpleTreatment(indented, true, false),
  wavy: wrapSimpleTreatment(wavy, true, false),
};

// #endregion

// #region VARIATIONS
// ----------------------------------------------------------------------------

function barry(count: number = 6) {
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [1, 4],
      ],
      x: -W_2,
      y: -H_2,
      width: W,
      height: H / (count / 2),
      // Explicitly require non-uniform scaling; it's the easiest way to implement barry.
      preserveAspectRatio: "none",
    },
    svg.line([0, 3], [1, 3], { strokeWidth: 2, stroke: "white" })
  );
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
  const width = (2 * Math.hypot(W, W)) / count;
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [4, 1],
      ],
      // The rotation happens last, so translating positively in x actually shifts visually
      // northeast. The rotation also happens around (0, 0), but we're trying to line up the corner
      // at (-50, -60), hence the weird math. There was a geometry drawing to prove this.
      x: Math.sqrt(Math.pow(H_2 - W_2, 2) / 2) + width / 2,
      width,
      height: H,
      // Explicitly require non-uniform scaling; it's the easiest way to implement paly.
      preserveAspectRatio: "none",
      patternTransform: { rotate: -Math.PI / 4 },
    },
    svg.line([3, 0], [3, 1], { strokeWidth: 2, stroke: "white" })
  );
}

function checky(count: number = 6) {
  const size = (2 * W) / count; // W < H, so we'll step based on that.
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [2, 2],
      ],
      width: size,
      height: size,
      x: -W_2,
      y: -H_2,
    },
    svg.rect([0, 0], [1, 1], { fill: "white" }),
    svg.rect([1, 1], [2, 2], { fill: "white" })
  );
}

function chevronny(count: number = 6) {
  const strokeVerticalHeight = H / count;
  const strokeWidth = Math.sqrt(Math.pow(strokeVerticalHeight, 2) / 2);
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [W, W_2 + strokeVerticalHeight],
      ],
      width: W,
      height: W_2 + strokeVerticalHeight,
    },
    svg.path(
      [
        { type: "M", loc: [0, strokeVerticalHeight / 2] },
        { type: "L", loc: [W_2, W_2 + strokeVerticalHeight / 2] },
        { type: "L", loc: [W, strokeVerticalHeight / 2] },
      ],
      { strokeWidth, stroke: "white", strokeLinecap: "square" }
    )
  );
}

function fusilly(count: number = 8) {
  const width = W / count;
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [2, 8],
      ],
      x: -width / 2 - W_2,
      y: -H_2,
      width,
      height: width * 4,
    },
    svg.polygon({
      points: [
        [1, 0],
        [2, 4],
        [1, 8],
        [0, 4],
      ],
      fill: "white",
    })
  );
}

function lozengy(count: number = 8) {
  const width = W / count;
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [2, 4],
      ],
      x: -width / 2 - W_2,
      y: -H_2,
      width,
      height: width * 2,
    },
    svg.polygon({
      points: [
        [1, 0],
        [2, 2],
        [1, 4],
        [0, 2],
      ],
      fill: "white",
    })
  );
}

function paly(count: number = 6) {
  return svg.pattern(
    {
      viewBox: [
        [0, 0],
        [4, 1],
      ],
      x: -W_2,
      y: -H_2,
      width: (2 * W) / count,
      height: H,
      // Explicitly require non-uniform scaling; it's the easiest way to implement paly.
      preserveAspectRatio: "none",
    },
    svg.line([3, 0], [3, 1], { strokeWidth: 2, stroke: "white" })
  );
}

const VARIATIONS: Record<VariationName, VariationPatternGenerator> = {
  barry,
  "barry bendy": barryBendy,
  bendy,
  checky,
  chevronny,
  fusilly,
  lozengy,
  paly,
};

// #endregion

// #region HIGHER-ORDER ELEMENTS
// ----------------------------------------------------------------------------

function field(tincture: Tincture) {
  // Expand the height so that when this is rendered on the extra-tall quarter segments it still fills.
  return svg.rect([-W_2, -H_2], [W_2, H_2 + 2 * (H_2 - W_2)], {
    classes: { fill: tincture },
  });
}

// Note that quarterings are NOT the same size. The top two are clipped to be square and the bottom
// two are made taller to compensate. This means that the cross point of the quarter ends up neatly
// centered underneath centered ordinaries or collections of charges.
const QUARTERINGS: Record<Quarter, { translate: Coordinate; height: number }> =
  {
    1: { translate: [-W_2 / 2, -H_2 / 2], height: W },
    2: { translate: [W_2 / 2, -H_2 / 2], height: W },
    3: { translate: [-W_2 / 2, (-H_2 + W) / 2], height: H + (H - W) },
    4: { translate: [W_2 / 2, (-H_2 + W) / 2], height: H + (H - W) },
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

async function simpleContent(element: SimpleContent): Promise<SVGElement[]> {
  if ("canton" in element) {
    const g = svg.g();
    applyTransforms(g, { origin: [-W_2, -H_2], scale: CANTON_SCALE_FACTOR });
    g.style.clipPath = `path("${CANTON_PATH}")`;
    g.appendChild(svg.path(CANTON_PATH, { classes: { fill: element.canton } }));
    g.classList.add(`fill-${element.canton}`);
    for (const c of element.content ?? []) {
      g.append(...(await simpleContent(c)));
    }
    return [g];
  } else if ("on" in element) {
    return on(element);
  } else if ("ordinary" in element) {
    return [ORDINARIES[element.ordinary](element)];
  } else if ("charge" in element) {
    const children: SVGElement[] = [];
    const locator = CHARGE_LOCATORS[element.placement ?? "none"];
    for (const [translate, scale] of locator.forCount(element.count)) {
      const rendered = await renderCharge(element);
      applyTransforms(rendered, {
        translate,
        scale,
        rotate: Posture.toRadians(element.posture),
      });
      children.push(rendered);
    }
    return children;
  } else {
    assertNever(element);
  }
}

async function complexContent(content: ComplexContent): Promise<SVGElement[]> {
  function overwriteCounterchangedTincture(
    element: SimpleContent,
    tincture: Tincture
  ): SimpleContent {
    function maybeToCounterchanged<T extends Tincture | undefined>(t: T): T {
      return (t === "counterchanged" ? tincture : t) as T;
    }

    if ("canton" in element) {
      // Cantons cannot be counterchanged; they always have a background and everything on them is
      // relative to their background. Thus, nop.
    } else if ("on" in element) {
      if (
        element.surround != null &&
        "tincture" in element.surround &&
        element.surround.tincture === "counterchanged"
      ) {
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
      if ("tincture" in element) {
        return {
          ...element,
          tincture: maybeToCounterchanged(element.tincture),
        };
      }
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
    const g2 = svg.g();

    // TODO: This should probably be a mask instead.
    g1.style.clipPath = `path("${PathCommand.toDString(
      party(content.treatment)
    )}")`;
    g1.appendChild(field(content.first));
    g2.appendChild(field(content.second));

    // Add g2 first so that it's underneath g1, which has the only clip path.
    const children: SVGElement[] = [g2, g1];
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
        g1.append(...(await simpleContent(counterchangedSecond)));
        g2.append(...(await simpleContent(counterchangedFirst)));
      } else {
        children.push(...(await simpleContent(content.content)));
      }
    }
    return children;
  } else if ("quarters" in content) {
    const quartered: Record<Quarter, SVGElement> = {
      1: svg.g(),
      2: svg.g(),
      3: svg.g(),
      4: svg.g(),
    };

    for (const [i_, { translate, height }] of Object.entries(QUARTERINGS)) {
      const i = +i_ as any as Quarter;
      applyTransforms(quartered[i], { translate, scale: 0.5 });
      quartered[i].style.clipPath = path`path("
        M -${W_2} -${H_2}
        l  ${W}    0
        l  0       ${height}
        l -${W}    0
        Z
      ")`;
    }

    for (const quartering of content.quarters) {
      for (const quarter of quartering.quarters) {
        quartered[quarter].append(
          ...(await complexContent(quartering.content))
        );
      }
    }

    for (const e of Object.values(quartered)) {
      if (e.children.length === 0) {
        e.appendChild(field("argent"));
      }
    }

    const children = Object.values(quartered);

    let line = svg.line([0, -H_2], [0, H_2], {
      strokeWidth: 0.5,
      classes: { stroke: "sable" },
    });
    line.setAttribute("vector-effect", "non-scaling-stroke");
    children.push(line);
    line = svg.line([-W_2, -H_2 + W_2], [W_2, -H_2 + W_2], {
      strokeWidth: 0.5,
      classes: { stroke: "sable" },
    });
    line.setAttribute("vector-effect", "non-scaling-stroke");
    children.push(line);

    if (content.overall) {
      children.push(...(await simpleContent(content.overall)));
    }

    return children;
  } else if ("variation" in content) {
    const g1 = svg.g();
    const g2 = svg.g();

    g1.appendChild(field(content.first));
    g2.appendChild(field(content.second));

    // TODO: Deduplicate this with party-per, if possible, or at least make them consistent.
    const id = uniqueId("pattern");
    const pattern = VARIATIONS[content.variation.type](content.variation.count);
    pattern.id = id;
    const mask = svg.mask(
      { id: `${id}-mask` },
      // TODO: Is this always the correct size? If rotates and such happen
      // at the pattern level, do we ever need to worry about changing the shape?
      svg.rect([-W_2, -H_2], [W_2, H_2], { fill: `url(#${id})` })
    );
    g2.setAttribute("mask", `url(#${id}-mask)`);

    const children: SVGElement[] = [pattern, mask, g1, g2];
    if (content.content != null) {
      const counterchangedFirst = content.content.map((c) =>
        overwriteCounterchangedTincture(c, content.first)
      );
      // See the party-per branch for why this check is here. I do not like it.
      if (!deepEqual(content.content, counterchangedFirst)) {
        const counterchangedSecond = content.content.map((c) =>
          overwriteCounterchangedTincture(c, content.second)
        );
        for (const c of counterchangedSecond) {
          g1.append(...(await simpleContent(c)));
        }
        for (const c of counterchangedFirst) {
          g2.append(...(await simpleContent(c)));
        }
      } else {
        for (const c of content.content) {
          children.push(...(await simpleContent(c)));
        }
      }
    }
    return children;
  } else {
    const children: SVGElement[] = [field(content.tincture)];
    for (const c of content.content ?? []) {
      children.push(...(await simpleContent(c)));
    }
    return children;
  }
}

async function on({ on, surround, charge }: On): Promise<SVGElement[]> {
  const children: SVGElement[] = [ORDINARIES[on.ordinary](on)];

  if (charge != null) {
    assert(
      charge.placement == null,
      'cannot specify a placement for charges in "on"'
    );

    const locator = ORDINARIES[on.ordinary].on;
    for (const [translate, scale] of locator.forCount(charge.count)) {
      const c = await renderCharge(charge);
      applyTransforms(c, {
        translate,
        scale,
        rotate: Posture.toRadians(charge.posture),
      });
      children.push(c);
    }
  }

  if (surround != null) {
    assert(
      surround.placement == null,
      'cannot specify a placement for charges in "between"'
    );

    const locator = ORDINARIES[on.ordinary].between;
    for (const [translate, scale] of locator.forCount(surround.count)) {
      const c = await renderCharge(surround);
      applyTransforms(c, {
        translate,
        scale,
        rotate: Posture.toRadians(surround.posture),
      });
      children.push(c);
    }
  }

  return children;
}

async function inescutcheon(
  parent: SVGElement,
  { location, content }: Inescutcheon
) {
  const escutcheon = svg.g(
    field("argent"),
    ...(await complexContent(content)),
    svg.path(ESCUTCHEON_PATH, { strokeWidth: 2, classes: { stroke: "sable" } })
  );
  escutcheon.setAttribute("clip-path", `path("${ESCUTCHEON_PATH}")`);
  applyTransforms(escutcheon, {
    scale: 0.25,
    translate: Location_.toOffset(location),
  });
  parent.appendChild(escutcheon);
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
async function parseAndRenderBlazon() {
  async function render(blazon: Blazon): Promise<void> {
    blazon = recursivelyOmitNullish(blazon);

    ast.innerHTML = JSON.stringify(blazon, null, 2);

    rendered.innerHTML = "";
    rendered.appendChild(
      svg.path(ESCUTCHEON_PATH, {
        strokeWidth: 2,
        classes: { stroke: "sable" },
      })
    );

    // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
    const container = svg.g();
    container.style.clipPath = `path("${ESCUTCHEON_PATH}")`;
    rendered.appendChild(container);
    // Make sure there's always a default background.
    container.appendChild(field("argent"));

    container.append(...(await complexContent(blazon.main)));
    if (blazon.inescutcheon != null) {
      await inescutcheon(container, blazon.inescutcheon);
    }
  }

  let results: Blazon[];
  try {
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    parser.feed(input.value.trim().toLowerCase());
    results = parser.results;
  } catch (e) {
    console.error(e);
    const message = (e as any)
      .toString()
      .replaceAll(/("(.)"[ \n$])+/g, (match: string) =>
        match.replaceAll('" "', "")
      )
      .replaceAll(/:\n.*?→ /g, " ")
      .replaceAll(/    [^^\n]+\n/g, "") // ^^
      .replaceAll(/A ("[aehilmnorsx]")/g, "An $1");
    error.innerHTML = message;
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
    async function step(sign: number) {
      which = (which + sign + results.length) % results.length;
      ambiguousCount.innerHTML = `${which + 1} / ${results.length}`;
      await render(results[which]);
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
    await render(results[0]);
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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  await parseAndRenderBlazon();
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
const TINCTURE_REGEX = new RegExp(`\\b(${TINCTURES.join("|")})\\b`, "g");
random.addEventListener("click", async () => {
  // 15 chosen empirically. Seems nice. Gets lions, where 12 does not.
  const blazon = Unparser(grammar, grammar.ParserStart, 15)
    // This is restatement of the regex rule for acceptable whitespace.
    .replaceAll(/[ \t\n\v\f,;:]+/g, " ")
    .trim()
    .replace(/ ?\.?$/, ".")
    .replaceAll(
      // It's REALLY hard to generate a random blazon where counterchanged makes sense, since the
      // grammar does not express a relationship between the context ("party per") and the tincture.
      // Since it's 1/8th of the colors, just ban it to reduce nonsense blazons by a lot.
      /\bcounterchanged\b/g,
      () => TINCTURES[Math.floor(Math.random() * TINCTURES.length)]
    )
    .replaceAll(
      TINCTURE_REGEX,
      (tincture) => `${tincture[0].toUpperCase()}${tincture.slice(1)}`
    )
    .replaceAll(/^.|\. ./g, (l) => l.toUpperCase());
  input.value = blazon;
  await parseAndRenderBlazon();
});

for (const example of document.querySelectorAll<HTMLAnchorElement>(
  "[data-example]"
)) {
  example.addEventListener("click", async (e) => {
    e.preventDefault();
    const a = e.target as HTMLAnchorElement;
    input.value = a.dataset.example || a.innerHTML;
    await parseAndRenderBlazon();
  });
}

parseAndRenderBlazon();

// #endregion
