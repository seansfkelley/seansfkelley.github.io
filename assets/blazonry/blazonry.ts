// TODO
// - some introductory text for shapes and colors and keywords with clickable links to demonstrate them
// - canton
// - posture -- for things like swords, requires resizing
// - posture -- incorrect for swords; we should probably rotate the SVG 90 degress and use that as the base
// - InDirection -- at least in the case of chevron and saltire, they are rotated to match -- matters for swords, at least
// - can party per field have complex content in it?
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, castle, and all their variants
// - decorations for lines (e.g. embattled, engrailed, etc.)
// - "overall"
// - parser can't figure out the correct assignment of the quarterly rules to parse this:
//     quarterly first and fourth party per pale argent and azure three mullets counterchanged in fess second and third sable
// - should be able to parse non-redundant usage of colors
//     argent on a bend between six mullets vert
// - make whitespace non-optional to force breaks

// TODO OPTIONAL
// - adjust positioning for `on` -- often the 2s and 3s are too close to each other, like for chief
// - push elements around when quartering

declare namespace PeggyParser {
  interface SyntaxError extends Error {
    expected: any;
    found: any;
    location: any;
    format: (opts: { source: string; text: string }[]) => string;
  }
}

declare const parser: {
  parse: (text: string, opts?: { grammarSource: string }) => ComplexContent;
};

type Count = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type Tincture = string & { __tincture: unknown };
type VariedName = string & { __varied: unknown };
type Posture = "palewise" | "fesswise" | "bendwise" | "saltirewise";
type Direction = "pale" | "fess" | "bend" | "chevron" | "saltire";
type InDirection = Direction | "cross";
type Quarter = 1 | 2 | 3 | 4;

type Coordinate = [x: number, y: number];

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

function evaluateLineSegment(
  src: Coordinate,
  dst: Coordinate,
  t: number
): Coordinate {
  assert(t >= 0 && t <= 1, "parameter must be on [0, 1]");
  return [(dst[0] - src[0]) * t + src[0], (dst[1] - src[1]) * t + src[1]];
}

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
  direction?: InDirection | null;
}

interface On {
  on: true;
  ordinary: Ordinary;
  surround?: Charge | null;
  charge?: Charge | null;
}

interface OrdinaryRenderer {
  (tincture: Tincture): SVGElement;
  on: ParametricLocator;
  surround: ParametricLocator;
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
  const bendWidth = W_2 / 3;
  return svg.path(
    path`
      M -${W_2 + bendWidth} -${H_2}
      L -${W_2}             -${H_2 + bendWidth}
      L  ${W_2 + bendWidth}  ${-H_2 + W}
      L  ${W_2}              ${-H_2 + W + bendWidth}
      Z
    `,
    tincture
  );
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

function chief(tincture: Tincture) {
  return svg.path(
    path`
      M -${W_2} ${-H_2}
      L -${W_2} ${-H_2 + H / 3}
      L  ${W_2} ${-H_2 + H / 3}
      L  ${W_2} ${-H_2}
      Z
    `,
    tincture
  );
}

chief.on = new LineSegmentLocator(
  [-W_2, -H_2 + H_2 / 3],
  [W_2, -H_2 + H_2 / 3],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
);

chief.surround = new NullLocator();

function chevron(tincture: Tincture) {
  return svg.path(
    path`
      M   0 -26
      L  59  33
      L  43  49
      L   0   6
      L -43  49
      L -59  33
      Z
    `,
    tincture
  );
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

function saltire(tincture: Tincture) {
  return svg.path(
    path`
      M  44 -70
      L  60 -54
      L  16 -10
      L  59  33
      L  43  49
      L   0   6
      L -43  49
      L -59  33
      L -16 -10
      L -60 -54
      L -44 -70
      L   0 -26
      Z
    `,
    tincture
  );
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
  Exclude<Charge["direction"], null | undefined> | "none",
  ParametricLocator
> = {
  fess: fess.on,
  pale: pale.on,
  bend: bend.on,
  chevron: chevron.on,
  saltire: saltire.on,
  cross: cross.on,
  none: new DefaultChargeLocator([-W_2, W_2], [-H_2, H_2 - 10]),
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
      const locator = CHARGE_DIRECTIONS[element.direction ?? "none"];
      for (const [translate, scale] of locator.forCount(element.count)) {
        const rendered = CHARGES[element.charge](element.tincture);
        applyTransforms(rendered, {
          translate,
          scale,
          rotate: element.posture ?? undefined,
        });
        parent.appendChild(rendered);
      }
    } else {
      assertNever(element);
    }
  }

  function overwriteCounterchangedTincture(
    element: Ordinary | Charge | On,
    tincture: Tincture
  ): Ordinary | Charge | On {
    if ("on" in element) {
      if (element.surround?.tincture === COUNTERCHANGED) {
        return {
          ...element,
          // Note that we do NOT overwrite the `charge` tincture. That's a function of the `on`, not the field.
          surround: { ...element.surround, tincture },
        };
      }
    } else if ("ordinary" in element) {
      if (element.tincture === COUNTERCHANGED) {
        return { ...element, tincture };
      }
    } else if ("charge" in element) {
      if (element.tincture === COUNTERCHANGED) {
        return { ...element, tincture };
      }
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

  if (charge != null) {
    assert(
      charge.direction == null,
      'cannot specify a direction for charges in "on"'
    );

    const locator = ORDINARIES[ordinary.ordinary].on;
    for (const [translate, scale] of locator.forCount(charge.count)) {
      const c = CHARGES[charge.charge](charge.tincture);
      applyTransforms(c, {
        translate,
        scale,
        rotate: charge.posture ?? undefined,
      });
      parent.appendChild(c);
    }
  }

  if (surround != null) {
    assert(
      surround.direction == null,
      'cannot specify a direction for charges in "between"'
    );

    const locator = ORDINARIES[ordinary.ordinary].surround;
    for (const [translate, scale] of locator.forCount(surround.count)) {
      const c = CHARGES[surround.charge](surround.tincture);
      applyTransforms(c, {
        translate,
        scale,
        rotate: surround.posture ?? undefined,
      });
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
