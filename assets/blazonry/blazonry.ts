// TODO
// - some introductory text for shapes and colors and keywords with clickable links to demonstrate them
// - posture -- for things like swords, requires resizing
// - posture -- incorrect for swords; we should probably rotate the SVG 90 degress and use that as the base
// - InDirection -- at least in the case of chevron and saltire, they are rotated to match -- matters for swords, at least
// - can party per field have complex content in it?
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, eagle, castle, boar, swan, tree, rose, escallop, and all their variants
// - decorations for lines (e.g. embattled, engrailed, etc.)
// - "overall"
// - parser can't figure out the correct assignment of the quarterly rules to parse this:
//     quarterly first and fourth party per pale argent and azure three mullets counterchanged in fess second and third sable
// - should be able to parse non-redundant usage of colors
//     argent on a bend between six mullets vert
// - make whitespace non-optional to force breaks
// - multiple ordiaries?
// - standardize size of charges (40x40?) so that scaling works as expected for all of them

// TODO OPTIONAL
// - adjust positioning for `on` -- often the 2s and 3s are too close to each other, like for chief
// - push elements around when quartering
// - canton-specific overrides for ordinaries and charge placements so they don't look squished by the scale

// #region LAYOUT

// TODO: Make _everything_ a function of these proportions.
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

// #endregion

// #region TYPES
// ----------------------------------------------------------------------------

interface Node {
  cloneNode<T>(this: T, deep?: boolean): T;
}

declare namespace PeggyParser {
  interface SyntaxError extends Error {
    expected: any;
    found: any;
    location: any;
    format: (opts: { source: string; text: string }[]) => string;
  }
}

declare const parser: {
  // Note: this output type is a _slight_ lie, in that the runtime value contains `null`s for some
  // optional fields, but the type only uses `?`. Call `recursivelyOmitNullish`.
  parse: (text: string, opts?: { grammarSource: string }) => ComplexContent;
};

type DiscriminateUnion<T, K extends keyof T, V extends T[K]> = T extends T
  ? V extends T[K]
    ? T
    : never
  : never;

type Count = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Tincture = string & { __tincture: unknown };
const Tincture = {
  NONE: "none" as Tincture,
  COUNTERCHANGED: "counterchanged" as Tincture,
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
        return Math.PI / 2;
      case "bendwise":
        return Math.PI / 4;
      case "saltirewise":
        return Math.PI / 4; // TODO
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
      content?: SimpleContent;
    }
  | {
      varied: Varied;
      first: Tincture;
      second: Tincture;
      content?: SimpleContent;
    };

interface Varied {
  type: VariedName;
  count?: number;
}

interface PartyPerField {
  direction: Direction;
  first: Tincture;
  second: Tincture;
  content?: SimpleContent;
  ornament?: Ornament;
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
  charge: "mullet" | "rondel" | "sword";
}

interface LionCharge extends BaseCharge {
  charge: "lion";
  armed?: Tincture;
  langued?: Tincture;
  pose: "passant" | "rampant" | "reguardant";
}

type Charge = SimpleCharge | LionCharge;

interface Canton {
  canton: Tincture;
  content?: SimpleContent;
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
}

interface ChargeRenderer<T extends Charge> {
  (charge: T): SVGElement;
}

interface VariedClipPathGenerator {
  (count?: number): string;
}

interface OrnamentPointGenerator {
  (x1: number, x2: number, yOffset: number, inverse: boolean): Coordinate[];
}

// #endregion

// #region LOCATORS AND SHAPES
// ----------------------------------------------------------------------------

type Coordinate = [x: number, y: number];

const Coordinate = {
  add: ([x1, y1]: Coordinate, [x2, y2]: Coordinate): Coordinate => [
    x1 + x2,
    y1 + y2,
  ],
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
  const angle =
    src[0] === dst[0]
      ? Math.PI / 2
      : Math.atan((dst[1] - src[1]) / (dst[0] - src[0]));
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
    if (total > this.scales.length) {
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
    if (total > this.sequence.length) {
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
    if (total > this.sequences.length) {
      return;
    }

    for (const coordinates of this.sequences[total - 1]) {
      yield [coordinates, this.scales[total - 1]];
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
      yield [this.reflect(translate), scale];
    }
  }

  private reflect(coordinate: Coordinate): Coordinate {
    // Too lazy to figure this out on my own, adapted from https://stackoverflow.com/a/3307181.
    const [x, y] = coordinate;
    const [x1, y1] = this.a;
    const [x2, y2] = this.b;

    if (x1 === x2) {
      return [x1 - x, y];
    }

    const m = (y2 - y1) / (x2 - x1);
    const c = (x2 * y1 - x1 * y2) / (x2 - x1);
    const d = (x + (y - c) * m) / (1 + m * m);
    return [2 * d - x, 2 * d * m - y + 2 * c];
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
    if (total > this.scales.length) {
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
    1.1, //
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
    if (total > DefaultChargeLocator.ROWS.length) {
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

function applyTransforms(
  element: SVGElement,
  {
    translate,
    scale,
    rotate,
  }: { translate?: Coordinate; scale?: number; rotate?: number } = {}
): void {
  const transform = [
    translate != null
      ? `translate(${translate[0]}, ${translate[1]})`
      : undefined,
    scale != null && scale !== 1 ? `scale(${scale})` : undefined,
    rotate != null ? `rotate(${(rotate / (2 * Math.PI)) * 360})` : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  element.setAttribute("transform", transform);
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

path.fromPoints = (points: Coordinate[]): string => {
  return "M " + points.map(([x, y]) => `${x} ${y}`).join(" L ") + " Z";
};

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

/**
 * Return the angle of the given line segment, in radians. Returns a value on [-pi, pi], according
 * to the relative direction from the first to second point.
 */
function radians([x1, y1]: Coordinate, [x2, y2]: Coordinate): number {
  if (x1 === x2) {
    // TODO: Confirm this is correct.
    return ((y1 < y2 ? 1 : -1) * Math.PI) / 2;
  } else {
    return Math.atan((y2 - y1) / (x2 - x1)) + (x2 < x1 ? Math.PI : 0);
  }
}

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

function bend({ tincture, cotised, ornament }: Ordinary) {
  const bend = svg.g();

  const bendWidth = W / 3;
  // Make sure it's long enough to reach diagonally!
  const bendLength = Math.hypot(W, H);

  const [tl, tr, br, bl] = [
    [0, -bendWidth / 2],
    [bendLength, -bendWidth / 2],
    [bendLength, bendWidth / 2],
    [0, bendWidth / 2],
  ] satisfies Coordinate[];

  if (ornament != null) {
    bend.appendChild(
      svg.path(
        path.fromPoints([
          ...ORNAMENTS[ornament](tl[0], tr[0], tl[1], false),
          // This is reversed because both of these go left -> right in order to line up the ornaments,
          // but the shape on the whole is draw clockwise, so this edge has to go backwards.
          ...ORNAMENTS[ornament](bl[0], br[0], br[1], true).reverse(),
        ]),
        tincture
      )
    );
  } else {
    bend.appendChild(
      svg.path(Quadrilateral.toSvgPath([tl, tr, br, bl]), tincture)
    );
  }

  if (cotised != null) {
    const offset = bendWidth / 2 + (COTISED_WIDTH * 3) / 2;
    bend.appendChild(
      svg.line([0, -offset], [bendLength, -offset], cotised, COTISED_WIDTH)
    );
    bend.appendChild(
      svg.line([0, offset], [bendLength, offset], cotised, COTISED_WIDTH)
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

bend.surround = new ReflectiveLocator(
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

function chief({ tincture, cotised }: Ordinary) {
  const chiefWidth = H / 3;

  const chief = svg.line(
    [-W_2, -H_2 + chiefWidth / 2],
    [W_2, -H_2 + chiefWidth / 2],
    tincture,
    chiefWidth
  );

  if (cotised == null) {
    return chief;
  } else {
    const g = svg.g();
    g.appendChild(chief);
    g.append(
      svg.line(
        [-W_2, -H_2 + chiefWidth + (COTISED_WIDTH * 3) / 2],
        [W_2, -H_2 + chiefWidth + (COTISED_WIDTH * 3) / 2],
        cotised,
        COTISED_WIDTH
      )
    );
    return g;
  }
}

chief.on = new LineSegmentLocator(
  [-W_2, -H_2 + H_2 / 3],
  [W_2, -H_2 + H_2 / 3],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
);

chief.surround = new NullLocator();

function chevron({ tincture, cotised }: Ordinary) {
  const chevronWidth = W / 4;

  const left: Coordinate = [-W_2, -H_2 + W];
  const right: Coordinate = [-W_2 + H, H_2];
  // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
  const mid: Coordinate = [0, -(H_2 - W_2)];

  const chevron = svg.g();
  chevron.appendChild(svg.line(left, mid, tincture, chevronWidth, "square"));
  chevron.appendChild(svg.line(mid, right, tincture, chevronWidth, "square"));

  if (cotised != null) {
    // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
    const offset = Math.sin(Math.PI / 4) * chevronWidth + COTISED_WIDTH * 2;

    for (const end of [left, right]) {
      for (const sign of [-1, 1]) {
        chevron.appendChild(
          svg.line(
            Coordinate.add(end, [0, sign * offset]),
            Coordinate.add(mid, [0, sign * offset]),
            tincture,
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

function cross({ tincture, cotised }: Ordinary) {
  const crossWidth = W / 4;
  // 14 is too hardcoded -- should be defined based on W/H ratios instead.
  const horizontalOffset = -14;

  const top: Coordinate = [0, -H_2];
  const bottom: Coordinate = [0, H_2];
  const left: Coordinate = [-W_2, horizontalOffset];
  const right: Coordinate = [W_2, horizontalOffset];

  const cross = svg.g();
  cross.appendChild(svg.line(top, bottom, tincture, crossWidth));
  cross.appendChild(svg.line(left, right, tincture, crossWidth));

  if (cotised != null) {
    const offset = crossWidth / 2 + (COTISED_WIDTH * 3) / 2;
    const mid: Coordinate = [0, horizontalOffset];

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
    [-30, -14],
    [30, -14],
    [0, -44],
    [0, 16],
    [0, -14],
  ],
  [0.4, 0.4, 0.4, 0.4, 0.4],
  {
    1: [[0, -14]],
  }
);

cross.surround = new SequenceLocator(
  [
    [-30, -42],
    [30, -42],
    [30, 12],
    [-30, 12],
  ],
  [0.5, 0.5, 0.5, 0.5],
  {
    1: SequenceLocator.EMPTY,
  }
);

function fess({ tincture, cotised }: Ordinary) {
  const verticalOffset = -H_2 + ((W / 3) * 3) / 2;

  const fessWidth = W / 3;
  const fess = svg.line(
    [-W_2, verticalOffset],
    [W_2, verticalOffset],
    tincture,
    fessWidth
  );

  if (cotised == null) {
    return fess;
  } else {
    const offset = fessWidth / 2 + (COTISED_WIDTH * 3) / 2;

    const g = svg.g();
    g.appendChild(fess);
    g.appendChild(
      svg.line(
        [-W_2, verticalOffset - offset],
        [W_2, verticalOffset - offset],
        cotised,
        COTISED_WIDTH
      )
    );
    g.appendChild(
      svg.line(
        [-W_2, verticalOffset + offset],
        [W_2, verticalOffset + offset],
        cotised,
        COTISED_WIDTH
      )
    );
    return g;
  }
}

fess.on = new LineSegmentLocator(
  [-W_2, -4],
  [W_2, -4],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
);

fess.surround = new ReflectiveLocator(
  new LineSegmentLocator(
    [-W_2, -H_2 + 18],
    [W_2, -H_2 + 18],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [-W_2, -4],
  [W_2, -4]
);

function pale({ tincture, cotised }: Ordinary) {
  const paleWidth = W / 3;
  const pale = svg.line([0, -H_2], [0, H_2], tincture, paleWidth);

  if (cotised == null) {
    return pale;
  } else {
    const horizontalOffset = paleWidth / 2 + (COTISED_WIDTH * 3) / 2;

    const g = svg.g();
    g.appendChild(pale);
    g.appendChild(
      svg.line(
        [-horizontalOffset, -H_2],
        [-horizontalOffset, H_2],
        cotised,
        COTISED_WIDTH
      )
    );
    g.appendChild(
      svg.line(
        [horizontalOffset, -H_2],
        [horizontalOffset, H_2],
        cotised,
        COTISED_WIDTH
      )
    );
    return g;
  }
}

pale.on = new LineSegmentLocator(
  [0, -H_2],
  [0, H_2],
  [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]
);

pale.surround = new ReflectiveLocator(
  new LineSegmentLocator(
    [-W_2 + 18, -H_2],
    [-W_2 + 18, W_2 - 10],
    [0.6, 0.5, 0.4, 0.4]
  ),
  [0, -H_2],
  [0, H_2]
);

function saltire({ tincture, cotised }: Ordinary) {
  const saltireWidth = W / 4;

  const tl: Coordinate = [-W_2, -H_2];
  const tr: Coordinate = [W_2, -H_2];
  const bl: Coordinate = [-W_2, -H_2 + W];
  const br: Coordinate = [-W_2 + H, H_2];

  const saltire = svg.g();
  saltire.appendChild(svg.line(tl, br, tincture, saltireWidth));
  saltire.appendChild(svg.line(bl, tr, tincture, saltireWidth));

  if (cotised != null) {
    // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
    const offset = Math.sin(Math.PI / 4) * saltireWidth + COTISED_WIDTH * 2;
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

const ORDINARIES: Record<string, OrdinaryRenderer> = {
  bend,
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

function sword({ tincture }: SimpleCharge) {
  return svg.path(
    "M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z",
    tincture
  );
}

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
    "M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z",
    tincture
  );
}

function lion({ tincture, armed, langued, pose }: LionCharge) {
  // TODO: tail is missing highlights
  // TODO: sizing and positioning still seems wrong
  // TODO: coloration should be optional, I guess?
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
} = { sword, rondel, mullet };

// A little unfortunate this dispatching wrapper is necessary, but it's the only way to type-safety
// render based on the string. Throwing all charges, simple and otherwise, into a constant mapping
// together means the inferred type of the function has `never` as the first argument. :(
function renderCharge(charge: Charge): SVGElement {
  switch (charge.charge) {
    case "sword":
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

function embattled(
  x1: number,
  x2: number,
  yOffset: number,
  invert: boolean
): Coordinate[] {
  const step = W / 12;

  let xStep = step;
  let yStep = step / 2;

  if (x2 < x1) {
    xStep = -xStep;
  }

  if (invert) {
    yStep = -yStep;
  }

  let x = x1;
  let y = yOffset - yStep / 2;

  const points: Coordinate[] = [
    [x, y],
    [(x += xStep / 2), y],
  ];

  const distance = Math.abs(x2 - x1) - step / 2;
  for (let i = 0; i < distance; i += step * 2) {
    points.push(
      [x, (y += yStep)],
      [(x += xStep), y],
      [x, (y -= yStep)],
      [(x += xStep), y]
    );
  }

  return points;
}

const ORNAMENTS: Record<string, OrnamentPointGenerator> = {
  embattled,
};

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

const PARTY_PER_CLIP_PATHS: Record<Direction, [string, string]> = {
  pale: [
    path`
      M -${W_2} -${H_2}
      L       0 -${H_2}
      L       0  ${H_2}
      L -${W_2}  ${H_2}
    `,
    path`
      M       0 -${H_2}
      L       0  ${H_2}
      L  ${W_2}  ${H_2}
      L  ${W_2} -${H_2}
    `,
  ],
  fess: [
    path`
      M -${W_2} -${H_2}
      L -${W_2}       0
      L  ${W_2}       0
      L  ${W_2} -${H_2}
      Z
    `,
    path`
      M -${W_2} ${H_2}
      L -${W_2}      0
      L  ${W_2}      0
      L  ${W_2} ${H_2}
      Z
    `,
  ],
  bend: [
    path`
      M -${W_2} ${-H_2}
      L  ${W_2} ${-H_2}
      L  ${W_2} ${-H_2 + W}
      Z
    `,
    path`
      M -${W_2} ${-H_2}
      L  ${W_2} ${-H_2 + W}
      L  ${W_2} ${H_2}
      L -${W_2} ${H_2}
      Z
    `,
  ],
  chevron: [
    // TODO: Done empirically, and to run the midline of the chevron ordinary. Both these and the
    // ordinary should be rewritten to be based on W/H.
    path`
      M -51  41
      L   0 -10
      L  51  41
      L  51  60
      L -51  60
      Z
    `,
    path`
      M -51  41
      L   0 -10
      L  51  41
      L  51 -60
      L -51 -60
      Z
    `,
  ],
  saltire: [
    // TODO: Same here as above for chevron.
    path`
      M -51  41
      L  52 -62
      L -52 -62
      L  51  41
      L  51  60
      L -51  60
      Z
    `,
    path`
      M -52 -62
      L  51  41
      L  52 -62
      L -51  41
      Z
    `,
  ],
};

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
const CANTON_PATH = path`
  M -${W_2} -${H_2}
  L  ${W_2} -${H_2}
  L  ${W_2}  ${H_2}
  L -${W_2}  ${H_2}
  Z
`;

function field(tincture: Tincture) {
  return svg.rect([-W_2, -H_2], [W_2, H_2], tincture);
}

function complexContent(container: SVGElement, content: ComplexContent) {
  function renderIntoParent(parent: SVGElement, element: SimpleContent) {
    if ("canton" in element) {
      const g = svg.g();
      g.setAttribute("transform-origin", `-${W_2} -${H_2}`);
      g.setAttribute(
        "transform",
        // The non-proportional scaling is a bit weird, but we want to have a square canton. A truly
        // "standards-compliant" implementation would have alternate forms of the ordinaries and
        // charges designed for a square canton, like a square cross. But this is a shortcut we take.
        `scale(${CANTON_SCALE_FACTOR}, ${(CANTON_SCALE_FACTOR * W) / H})`
      );

      g.style.clipPath = `path("${CANTON_PATH}")`;
      g.appendChild(svg.path(CANTON_PATH, element.canton));
      g.classList.add(`fill-${element.canton}`);
      parent.appendChild(g);
      if (element.content) {
        renderIntoParent(g, element.content);
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

  if ("direction" in content) {
    const g1 = svg.g();
    g1.style.clipPath = `path("${PARTY_PER_CLIP_PATHS[content.direction][0]}")`;
    const g2 = svg.g();
    g2.style.clipPath = `path("${PARTY_PER_CLIP_PATHS[content.direction][1]}")`;
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
  } else if ("varied" in content) {
    container.appendChild(field(content.first));
    const second = field(content.second);
    second.style.clipPath = `path("${VARIED[content.varied.type](
      content.varied.count
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

function parseAndRenderBlazon() {
  let result;
  try {
    result = parser.parse(input.value.trim().toLowerCase(), {
      grammarSource: "input",
    });
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = (e as PeggyParser.SyntaxError).format([
      { source: "input", text: input.value },
    ]);
    error.style.display = "block";
    return;
  }

  result = recursivelyOmitNullish(result);

  ast.innerHTML = JSON.stringify(result, null, 2);

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
  container.appendChild(field("argent" as Tincture));

  complexContent(container, result);
}

const input: HTMLTextAreaElement = document.querySelector("#blazon-input")!;
const form: HTMLFormElement = document.querySelector("#form")!;
const rendered: SVGSVGElement = document.querySelector("#rendered")!;
const error: HTMLPreElement = document.querySelector("#error")!;
const ast: HTMLPreElement = document.querySelector("#ast")!;

form.addEventListener("submit", (e) => {
  e.preventDefault();
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

parseAndRenderBlazon();

// These files are small and there's not that many of them, so it's easier if we just eagerly
// load of these and then try to access them sync later and hope for the best. Making the ENTIRE
// implementation sync just for this is a passive PITA.
fetchComplexSvg("lion", "rampant");

// #endregion
