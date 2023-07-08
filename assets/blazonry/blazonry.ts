// TODO
// - do ParametricLocators for `surround`
// - adjust positioning for `on` -- often the 2s and 3s are too close to each other, like for chief
// - canton
// - posture -- for things like swords, requires resizing
// - direction... does it work?
// - push elements around when quartering
// - can party per field have complex content in it?
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, castle, and all their variants
// - decorations for lines (e.g. embattled, engrailed, etc.)

const DEBUG = false;

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
  evaluate(index: number, total: number): [Coordinate, number] | undefined;
  toSvgPath(): string;
}

class LineSegmentLocator implements ParametricLocator {
  constructor(
    private a: Coordinate,
    private b: Coordinate,
    private scales: number[]
  ) {}

  evaluate(index: number, total: number): [Coordinate, number] | undefined {
    assert(index < total, "index must be less than total");
    assert(index >= 0, "index must be nonnegative");

    if (total > this.scales.length) {
      return undefined;
    }

    const t = (index + 1) / (total + 1);
    return [
      [
        (this.b[0] - this.a[0]) * t + this.a[0],
        (this.b[1] - this.a[1]) * t + this.a[1],
      ],
      this.scales[total - 1],
    ];
  }

  public toSvgPath(): string {
    return path`
      M ${this.a[0]} ${this.a[1]}
      L ${this.b[0]} ${this.b[1]}
    `;
  }
}

class MultiPointLocator implements ParametricLocator {
  constructor(
    private sequence: Coordinate[],
    private scales: number[],
    private exceptions: Record<number, Coordinate[]> = {}
  ) {
    assert(
      sequence.length === scales.length,
      "must have the same number of coordinates in sequence as scales"
    );
  }

  public evaluate(
    index: number,
    total: number
  ): [Coordinate, number] | undefined {
    assert(index < total, "index must be less than total");
    assert(index >= 0, "index must be nonnegative");

    if (total > this.sequence.length) {
      return undefined;
    }

    return [
      this.exceptions[total]?.[index] ?? this.sequence[index],
      this.scales[total - 1],
    ];
  }

  public toSvgPath(): string {
    // TODO
    return "";
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
  // If undefined, render nothing.
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
) satisfies OrdinaryRenderer["on"];

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

chief.on = new LineSegmentLocator(
  [-W_2, -40],
  [W_2, -40],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
) satisfies OrdinaryRenderer["on"];

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

function chevronOnLocator(fraction: number, isEven: boolean) {
  if (isEven) {
    return new ParametricPolyline(
      {
        src: [-W_2 * fraction, W_2 * fraction - 10],
        dst: [-W_2 * 0.1, -10 + W_2 * 0.1],
        highLimit: 0.5,
      },
      {
        src: [W_2 * 0.1, -10 + W_2 * 0.1],
        dst: [W_2 * fraction, W_2 * fraction - 10],
        highLimit: 1,
      }
    );
  } else {
    return new ParametricPolyline(
      {
        src: [-W_2 * fraction, W_2 * fraction - 10],
        dst: [0, -8],
        highLimit: 0.5,
      },
      {
        src: [0, -8],
        dst: [W_2 * fraction, W_2 * fraction - 10],
        highLimit: 1,
      }
    );
  }
}

// TODO
chevron.on = {
  // 1: { locator: chevronOnLocator(0, false), scale: 0.4 },
  // 2: { locator: chevronOnLocator(0.3, true), scale: 0.4 },
  // 3: { locator: chevronOnLocator(0.4, false), scale: 0.4 },
  // 4: { locator: chevronOnLocator(0.6, true), scale: 0.4 },
  // 5: { locator: chevronOnLocator(0.6, false), scale: 0.35 },
  // 6: { locator: chevronOnLocator(0.7, true), scale: 0.35 },
  // 7: { locator: chevronOnLocator(0.7, false), scale: 0.3 },
  // 8: { locator: chevronOnLocator(0.7, true), scale: 0.25 },
} satisfies OrdinaryRenderer["on"];

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

cross.on = new MultiPointLocator(
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
) satisfies OrdinaryRenderer["on"];

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
  [W_2, 4],
  [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]
) satisfies OrdinaryRenderer["on"];

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
) satisfies OrdinaryRenderer["on"];

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

saltire.on = new MultiPointLocator(
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
) satisfies OrdinaryRenderer["on"];

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

const CHARGE_DIRECTIONS: Record<Direction | "none", ParametricLocator> = {
  fess: fess.on,
  pale: pale.on,
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
      for (let i = 0; i < element.count; ++i) {
        const rendered = CHARGES[element.charge](element.tincture);
        const location = locator.evaluate(i, element.count);
        if (location != null) {
          const [translate, scale] = location;
          applyTransforms(rendered, { translate, scale });
        }
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

  assert(
    charge.direction == null,
    'cannot specify a direction for charges in "on"'
  );

  const locator = ORDINARIES[ordinary.ordinary].on;
  for (let i = 0; i < charge.count; ++i) {
    const c = CHARGES[charge.charge](charge.tincture);
    const location = locator.evaluate(i, charge.count);
    if (location != null) {
      const [translate, scale] = location;
      applyTransforms(c, {
        translate,
        scale,
        rotate: charge.posture ?? undefined,
      });
      parent.appendChild(c);
    }

    if (DEBUG) {
      const debugPath = svg.path(locator.toSvgPath(), "none");
      debugPath.setAttribute("stroke-width", "2");
      debugPath.setAttribute("stroke", "magenta");
      parent.appendChild(debugPath);
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
    // TODO
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
