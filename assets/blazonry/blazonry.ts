// TODO
// - finish eyeballing direction/on/surround
// - do actual math instead of eyeballing for direction/on/surround offsets
// - canton
// - posture -- for things like swords, requires resizing
// - fancy paths for leopard's heads and such
// - push elements around when quartering
// - party per field can also have complex content in it
// - minor visual effects to make it a little less flat

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
  on: Partial<Record<Count, Transform[]>>;
  surround: Partial<Record<Exclude<Count, 1>, Transform[]>>;
}

interface ChargeRenderer {
  (tincture: Tincture): SVGElement;
}

interface VariedClipPathGenerator {
  (count: number): string;
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`assertion failure: ${message}`);
  }
}

function assertNever(nope: never): never {
  throw new Error("was not never");
}

const FIELD_PATH =
  // This one is pointier, but looks weirder with some bends:
  // "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z";
  "M -50 -60 L 50 -60 L 50 20 C 50 40 30 50 0 60 C -30 50 -50 40 -50 20 Z";

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
  const outline = path(FIELD_PATH, "none");
  outline.classList.add("outline");
  rendered.appendChild(outline);

  // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
  const container = document.createElementNS("http://www.w3.org/2000/svg", "g");
  container.style.clipPath = `path("${FIELD_PATH}")`;
  rendered.appendChild(container);
  // Make sure there's always a default background.
  container.appendChild(field("argent" as Tincture));

  complexContent(container, result);
}

function field(tincture: Tincture) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "-50");
  rect.setAttribute("y", "-60");
  rect.setAttribute("width", "100");
  rect.setAttribute("height", "120");
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

function path(d: string, tincture: Tincture | "none") {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.classList.add(`fill-${tincture}`);
  return path;
}

// ----------------------------------------------------------------------------
// ORDINARIES
// ----------------------------------------------------------------------------

function bend(tincture: Tincture) {
  return path("M -59 -51 L 41 63 L 59 45 L -41 -69 Z", tincture);
}

bend.on = {
  1: [
    Transform.of(0, -4, 0.4), //
  ],
  2: [
    Transform.of(-15, -20, 0.4), //
    Transform.of(15, 14, 0.4),
  ],
  3: [
    Transform.of(-25, -31, 0.4), //
    Transform.of(0, -4, 0.4),
    Transform.of(25, 23, 0.4),
  ],
  4: [
    Transform.of(-31, -38, 0.4), //
    Transform.of(-10, -14, 0.4),
    Transform.of(10, 9, 0.4),
    Transform.of(31, 31, 0.4),
  ],
} satisfies OrdinaryRenderer["on"];

function chief(tincture: Tincture) {
  return path("M -50 -60 L -50 -20 L 50 -20 L 50 -60 Z", tincture);
}

function chevron(tincture: Tincture) {
  return path("M 0 -22 L 55 33 L 43 45 L 0 2 L -43 45 L -55 33 Z", tincture);
}

function cross(tincture: Tincture) {
  return path(
    "M -10 -60 L 10 -60 L 10 -24 L 50 -24 L 50 -4 L 10 -4 L 10 60 L -10 60 L -10 -4 L -50 -4 L -50 -24 L -10 -24 Z",
    tincture
  );
}

function fess(tincture: Tincture) {
  return path("M -50 -25 L 50 -25 L 50 15 L -50 15 Z", tincture);
}

fess.on = {
  1: [
    Transform.of(0, -5, 0.6), //
  ],
  2: [
    Transform.of(-20, -5, 0.6), //
    Transform.of(20, -5, 0.6),
  ],
  3: [
    Transform.of(-30, -5, 0.5),
    Transform.of(0, -5, 0.5),
    Transform.of(30, -5, 0.5),
  ],
  4: [
    Transform.of(-33, -5, 0.4),
    Transform.of(-11, -5, 0.4),
    Transform.of(11, -5, 0.4),
    Transform.of(33, -5, 0.4),
  ],
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
  return path("M -15 -60 L 15 -60 L 15 60 L -15 60 Z", tincture);
}

function saltire(tincture: Tincture) {
  return path(
    "M 44 -66 L 56 -54 L 12 -10 L 55 33 L 43 45 L 0 2 L -43 45 L -55 33 L -12 -10 L -56 -54 L -44 -66 L 0 -22 Z",
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
  return path(
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
  return path(
    "M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z",
    tincture
  );
}

const CHARGE_DIRECTIONS: Record<
  Direction | "none",
  Partial<Record<Count, Transform[]>>
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

// TODO: Factor this out to the top so _everything_ is a function of it.
const HEIGHT = 120;
const WIDTH = 100;

function barry(count: number) {
  const step = HEIGHT / count;
  let path = "";
  for (let y = 1; y < count; y += 2) {
    path += `
    M -50 ${-HEIGHT / 2 + y * step}
    L  50 ${-HEIGHT / 2 + y * step}
    L  50 ${-HEIGHT / 2 + y * step + step}
    L -50 ${-HEIGHT / 2 + y * step + step}
    Z`;
  }
  return path;
}

function barryBendy(count: number) {
  throw new Error("unimplemented");
}

function bendy(count: number) {
  throw new Error("unimplemented");
}

function checky(count: number) {
  // w < h, so we use that to determine step (also it's more intuitive)
  const step = WIDTH / count;
  let path = "";
  for (let x = 0; x < count; ++x) {
    for (let y = x % 2; y < (HEIGHT / WIDTH) * count; y += 2) {
      path += `
        M ${-WIDTH / 2 + x * step}        ${-HEIGHT / 2 + y * step}
        L ${-WIDTH / 2 + x * step}        ${-HEIGHT / 2 + y * step + step}
        L ${-WIDTH / 2 + x * step + step} ${-HEIGHT / 2 + y * step + step}
        L ${-WIDTH / 2 + x * step + step} ${-HEIGHT / 2 + y * step}
        Z`;
    }
  }
  return path;
}

function chevronny(count: number) {
  throw new Error("unimplemented");
}

function lozengy(count: number) {
  throw new Error("unimplemented");
}

function paly(count: number) {
  const step = WIDTH / count;
  let path = "";
  for (let x = 1; x < count; x += 2) {
    path += `
      M ${-WIDTH / 2 + x * step}        -60
      L ${-WIDTH / 2 + x * step}         60
      L ${-WIDTH / 2 + x * step + step}  60
      L ${-WIDTH / 2 + x * step + step} -60
      Z`;
  }
  return path;
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
    const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
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
      1: document.createElementNS("http://www.w3.org/2000/svg", "g"),
      2: document.createElementNS("http://www.w3.org/2000/svg", "g"),
      3: document.createElementNS("http://www.w3.org/2000/svg", "g"),
      4: document.createElementNS("http://www.w3.org/2000/svg", "g"),
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
      content.varied.count ?? 6
    ).replaceAll("\n", " ")}")`;
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
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.appendChild(ORDINARIES[ordinary.ordinary](ordinary.tincture));
  parent.appendChild(g);

  assert(
    charge.direction == null,
    'cannot specify a direction for charges in "on"'
  );

  for (const transform of ORDINARIES[ordinary.ordinary].on[charge.count] ??
    []) {
    const c = CHARGES[charge.charge](charge.tincture);
    Transform.apply(transform, c, charge);
    parent.appendChild(c);
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
