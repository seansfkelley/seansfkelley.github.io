"use strict";
// TODO
// - do something like ParametricLocators but for `surround`
// - canton
// - posture -- for things like swords, requires resizing
// - direction... does it work?
// - push elements around when quartering
// - can party per field have complex content in it?
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, castle, and all their variants
// - decorations for lines (e.g. embattled, engrailed, etc.)
const DEBUG = false;
const Transform = {
    of: (x, y, scale) => ({ x, y, scale }),
    apply: ({ x, y, scale }, element, { posture } = {}) => {
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
function applyTransforms(element, { translate, scale, rotate, } = {}) {
    function getRotation(posture) {
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
const QUARTERINGS = {
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
class ParametricPoint {
    point;
    constructor(point) {
        this.point = point;
    }
    evaluate(index, total) {
        assert(index < total, "index must be less than total");
        assert(index >= 0, "index must be nonnegative");
        return this.point;
    }
    toSvgPath() {
        // TODO
        return "";
    }
}
class ParametricMultiPoint {
    points;
    constructor(points) {
        this.points = points;
    }
    evaluate(index, total) {
        assert(index < total, "index must be less than total");
        assert(index < this.points.length, "index must be less than the number of points");
        assert(index >= 0, "index must be nonnegative");
        return this.points[index];
    }
    toSvgPath() {
        // TODO
        return "";
    }
}
class ParametricLine {
    src;
    dst;
    constructor(src, dst) {
        this.src = src;
        this.dst = dst;
    }
    evaluate(index, total) {
        assert(index < total, "index must be less than total");
        assert(index >= 0, "index must be nonnegative");
        const t = total === 1 ? 0.5 : index / (total - 1);
        return [
            (this.dst[0] - this.src[0]) * t + this.src[0],
            (this.dst[1] - this.src[1]) * t + this.src[1],
        ];
    }
    toSvgPath() {
        return path `
      M ${this.src[0]} ${this.src[1]}
      L ${this.dst[0]} ${this.dst[1]}
    `;
    }
}
class ParametricPolyline {
    segments;
    constructor(...segments) {
        assert(segments.length > 0, "must have at least one segment");
        assert(segments.at(-1).highLimit === 1, "last segment must end at 1");
        this.segments = segments;
    }
    evaluate(index, total) {
        assert(index < total, "index must be less than total");
        assert(index >= 0, "index must be nonnegative");
        const t = total === 1 ? 0.5 : index / (total - 1);
        let lowLimit = 0;
        for (const s of this.segments) {
            if (t <= s.highLimit) {
                const fraction = (t - lowLimit) / (s.highLimit - lowLimit);
                return [
                    (s.dst[0] - s.src[0]) * fraction + s.src[0],
                    (s.dst[1] - s.src[1]) * fraction + s.src[1],
                ];
            }
            else {
                lowLimit = s.highLimit;
            }
        }
        throw new Error("should be unreachable");
    }
    toSvgPath() {
        const segments = this.segments.map((s) => path `
      M ${s.src[0]} ${s.src[1]}
      L ${s.dst[0]} ${s.dst[1]}
    `);
        return segments.join(" ");
    }
}
function assert(condition, message) {
    if (!condition) {
        throw new Error(`assertion failure: ${message}`);
    }
}
function assertNever(nope) {
    throw new Error("was not never");
}
// TODO: Factor this out to the top so _everything_ is a function of it.
const H = 120;
const H_2 = H / 2;
const W = 100;
const W_2 = W / 2;
// This one is pointier, but looks weirder with some bends:
// "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z";
const FIELD_PATH = path `
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
function path(strings, ...values) {
    const parts = [];
    for (let i = 0; i < values.length; ++i) {
        parts.push(strings[i], values[i]);
    }
    parts.push(strings.at(-1));
    return parts.join("").trim().replaceAll("\n", "").replaceAll(/ +/g, " ");
}
const COUNTERCHANGED = "counterchanged";
function parseAndRenderBlazon(text) {
    let result;
    try {
        result = parser.parse(text.trim().toLowerCase());
        error.style.display = "none";
    }
    catch (e) {
        error.innerHTML = e.toString();
        error.style.display = "block";
        console.error("start", e.location?.start);
        console.error("end", e.location?.end);
        console.error("expected", e.expected);
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
    container.appendChild(field("argent"));
    complexContent(container, result);
}
function field(tincture) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", `-${W_2}`);
    rect.setAttribute("y", `-${H_2}`);
    rect.setAttribute("width", `${W}`);
    rect.setAttribute("height", `${H}`);
    rect.classList.add(`fill-${tincture}`);
    return rect;
}
const PARTY_PER_CLIP_PATHS = {
    pale: [
        path `
      M -${W_2} -${H_2}
      L       0 -${H_2}
      L       0  ${H_2}
      L -${W_2}  ${H_2}
    `,
        path `
      M       0 -${H_2}
      L       0  ${H_2}
      L  ${W_2}  ${H_2}
      L  ${W_2} -${H_2}
    `,
    ],
    fess: [
        path `
      M -${W_2} -${H_2}
      L -${W_2}       0
      L  ${W_2}       0
      L  ${W_2} -${H_2}
      Z
    `,
        path `
      M -${W_2} ${H_2}
      L -${W_2}      0
      L  ${W_2}      0
      L  ${W_2} ${H_2}
      Z
    `,
    ],
    bend: [
        path `
      M -${W_2} ${-H_2}
      L  ${W_2} ${-H_2}
      L  ${W_2} ${-H_2 + W}
      Z
    `,
        path `
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
        path `
      M -51  41
      L   0 -10
      L  51  41
      L  51  60
      L -51  60
      Z
    `,
        path `
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
        path `
      M -51  41
      L  52 -62
      L -52 -62
      L  51  41
      L  51  60
      L -51  60
      Z
    `,
        path `
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
    path: (d, fill) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.classList.add(`fill-${fill}`);
        return path;
    },
    g: () => {
        return document.createElementNS("http://www.w3.org/2000/svg", "g");
    },
};
// ----------------------------------------------------------------------------
// ORDINARIES
// ----------------------------------------------------------------------------
function bend(tincture) {
    const bendWidth = W_2 / 3;
    return svg.path(path `
      M -${W_2 + bendWidth} -${H_2}
      L -${W_2}             -${H_2 + bendWidth}
      L  ${W_2 + bendWidth}  ${-H_2 + W}
      L  ${W_2}              ${-H_2 + W + bendWidth}
      Z
    `, tincture);
}
function bendOnLocator(fraction) {
    return new ParametricLine([-W_2 * fraction, -W_2 * fraction - 10], [W_2 * fraction, W_2 * fraction - 10]);
}
bend.on = {
    1: { locator: bendOnLocator(0), scale: 0.5 },
    2: { locator: bendOnLocator(0.4), scale: 0.5 },
    3: { locator: bendOnLocator(0.5), scale: 0.5 },
    4: { locator: bendOnLocator(0.6), scale: 0.5 },
    5: { locator: bendOnLocator(0.7), scale: 0.4 },
    6: { locator: bendOnLocator(0.7), scale: 0.35 },
    7: { locator: bendOnLocator(0.7), scale: 0.3 },
    8: { locator: bendOnLocator(0.7), scale: 0.25 },
};
function chief(tincture) {
    return svg.path(path `
      M -50 -60
      L -50 -20
      L  50 -20
      L  50 -60
      Z
    `, tincture);
}
function chiefOnLocator(fraction) {
    return new ParametricLine([-W_2 * fraction, -40], [W_2 * fraction, -40]);
}
chief.on = {
    1: { locator: chiefOnLocator(0), scale: 0.6 },
    2: { locator: chiefOnLocator(0.5), scale: 0.6 },
    3: { locator: chiefOnLocator(0.6), scale: 0.5 },
    4: { locator: chiefOnLocator(0.7), scale: 0.4 },
    5: { locator: chiefOnLocator(0.7), scale: 0.3 },
    6: { locator: chiefOnLocator(0.7), scale: 0.25 },
    7: { locator: chiefOnLocator(0.7), scale: 0.2 },
    8: { locator: chiefOnLocator(0.7), scale: 0.18 },
};
function chevron(tincture) {
    return svg.path(path `
      M   0 -26
      L  59  33
      L  43  49
      L   0   6
      L -43  49
      L -59  33
      Z
    `, tincture);
}
function chevronOnLocator(fraction, isEven) {
    if (isEven) {
        return new ParametricPolyline({
            src: [-W_2 * fraction, W_2 * fraction - 10],
            dst: [-W_2 * 0.1, -10 + W_2 * 0.1],
            highLimit: 0.5,
        }, {
            src: [W_2 * 0.1, -10 + W_2 * 0.1],
            dst: [W_2 * fraction, W_2 * fraction - 10],
            highLimit: 1,
        });
    }
    else {
        return new ParametricPolyline({
            src: [-W_2 * fraction, W_2 * fraction - 10],
            dst: [0, -8],
            highLimit: 0.5,
        }, {
            src: [0, -8],
            dst: [W_2 * fraction, W_2 * fraction - 10],
            highLimit: 1,
        });
    }
}
chevron.on = {
    1: { locator: chevronOnLocator(0, false), scale: 0.4 },
    2: { locator: chevronOnLocator(0.3, true), scale: 0.4 },
    3: { locator: chevronOnLocator(0.4, false), scale: 0.4 },
    4: { locator: chevronOnLocator(0.6, true), scale: 0.4 },
    5: { locator: chevronOnLocator(0.6, false), scale: 0.35 },
    6: { locator: chevronOnLocator(0.7, true), scale: 0.35 },
    7: { locator: chevronOnLocator(0.7, false), scale: 0.3 },
    8: { locator: chevronOnLocator(0.7, true), scale: 0.25 },
};
function cross(tincture) {
    return svg.path(path `
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
    `, tincture);
}
const CROSS_LOCATOR = new ParametricMultiPoint([
    [-30, -14],
    [30, -14],
    [0, -44],
    [0, 16],
    [0, -14],
]);
cross.on = {
    1: { locator: new ParametricPoint([0, -14]), scale: 0.4 },
    2: { locator: CROSS_LOCATOR, scale: 0.4 },
    3: { locator: CROSS_LOCATOR, scale: 0.4 },
    4: { locator: CROSS_LOCATOR, scale: 0.4 },
    5: { locator: CROSS_LOCATOR, scale: 0.4 },
};
function fess(tincture) {
    return svg.path(path `
      M -50 -25
      L  50 -25
      L  50  15
      L -50  15
      Z
    `, tincture);
}
function fessOnLocator(fraction) {
    return new ParametricLine([-W_2 * fraction, -4], [W_2 * fraction, -4]);
}
fess.on = {
    1: { locator: fessOnLocator(0), scale: 0.6 },
    2: { locator: fessOnLocator(0.5), scale: 0.6 },
    3: { locator: fessOnLocator(0.6), scale: 0.5 },
    4: { locator: fessOnLocator(0.7), scale: 0.4 },
    5: { locator: fessOnLocator(0.7), scale: 0.3 },
    6: { locator: fessOnLocator(0.7), scale: 0.25 },
    7: { locator: fessOnLocator(0.7), scale: 0.2 },
    8: { locator: fessOnLocator(0.7), scale: 0.18 },
};
fess.surround = {
    2: [
        Transform.of(0, -42, 0.6),
        Transform.of(0, 35, 0.6),
    ],
    3: [
        Transform.of(-25, -42, 0.6),
        Transform.of(25, -42, 0.6),
        Transform.of(0, 35, 0.6),
    ],
    4: [
        Transform.of(-25, -42, 0.6),
        Transform.of(25, -42, 0.6),
        Transform.of(-15, 35, 0.5),
        Transform.of(15, 35, 0.5),
    ],
};
function pale(tincture) {
    return svg.path(path `
      M -15 -60
      L  15 -60
      L  15  60
      L -15  60
      Z
    `, tincture);
}
function paleOnLocator(fraction) {
    return new ParametricLine([0, -H_2 * fraction], [0, H_2 * fraction]);
}
pale.on = {
    1: { locator: paleOnLocator(0), scale: 0.6 },
    2: { locator: paleOnLocator(0.4), scale: 0.6 },
    3: { locator: paleOnLocator(0.6), scale: 0.5 },
    4: { locator: paleOnLocator(0.6), scale: 0.4 },
    5: { locator: paleOnLocator(0.7), scale: 0.4 },
    6: { locator: paleOnLocator(0.7), scale: 0.3 },
    7: { locator: paleOnLocator(0.7), scale: 0.3 },
    8: { locator: paleOnLocator(0.7), scale: 0.2 },
};
function saltire(tincture) {
    return svg.path(path `
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
    `, tincture);
}
const SALTIRE_LOCATOR = new ParametricMultiPoint([
    [-25, -35],
    [25, -35],
    [25, 15],
    [-25, 15],
    [0, -10],
]);
saltire.on = {
    1: { locator: new ParametricPoint([0, -10]), scale: 0.5 },
    2: { locator: SALTIRE_LOCATOR, scale: 0.5 },
    3: { locator: SALTIRE_LOCATOR, scale: 0.5 },
    4: { locator: SALTIRE_LOCATOR, scale: 0.5 },
    5: { locator: SALTIRE_LOCATOR, scale: 0.5 },
};
const ORDINARIES = {
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
function sword(tincture) {
    return svg.path("M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z", tincture);
}
function rondel(tincture) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "20");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.classList.add(`fill-${tincture}`);
    return circle;
}
function mullet(tincture) {
    return svg.path("M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z", tincture);
}
const CHARGE_DIRECTIONS = {
    none: {
        1: [
            Transform.of(0, -5), //
        ],
        2: [
            Transform.of(-20, -5, 0.75),
            Transform.of(20, -5, 0.75),
        ],
        3: [
            Transform.of(0, -23, 0.75),
            Transform.of(-20, 7, 0.75),
            Transform.of(20, 7, 0.75),
        ],
    },
    fess: {
        1: [
            Transform.of(0, -5), //
        ],
        2: [
            Transform.of(-20, -5, 0.75),
            Transform.of(20, -5, 0.75),
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
    },
};
const CHARGES = {
    sword,
    rondel,
    mullet,
};
// ----------------------------------------------------------------------------
// VARIED
// ----------------------------------------------------------------------------
function barry(count = 6) {
    const step = H / count;
    let d = "";
    for (let y = 1; y < count; y += 2) {
        d += path `
      M -${W_2} ${-H_2 + y * step}
      L  ${W_2} ${-H_2 + y * step}
      L  ${W_2} ${-H_2 + y * step + step}
      L -${W_2} ${-H_2 + y * step + step}
      Z
    `;
    }
    return d;
}
function barryBendy(count = 8) {
    count *= 2; // Looks better, and feels easier to specify the desired value, with higher counts.
    const step = (W / count) * 2;
    let d = "";
    for (let y = 0; y < (H / W) * count; y++) {
        for (let x = y % 2; x < count; x += 2) {
            const offset = (1 / 2) * y;
            d += path `
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
function bendy(count = 8) {
    const step = (W / count) * 2;
    let d = "";
    // This is a bit wasteful, as it generates a clipping path considerably larger than the w * h area...
    for (let i = 1; i < count * 2; i += 2) {
        d += path `
      M  ${W_2 - i * step}       ${-H_2}
      L  ${W_2 - (i + 1) * step} ${-H_2}
      L  ${W_2}                  ${-H_2 + (i + 1) * step}
      L  ${W_2}                  ${-H_2 + i * step}
      Z
    `;
    }
    return d;
}
function checky(count = 8) {
    // w < h, so we use that to determine step (also it's more intuitive)
    const step = W / count;
    let d = "";
    for (let y = 0; y < (H / W) * count; y++) {
        for (let x = y % 2; x < count; x += 2) {
            d += path `
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
function chevronny(count = 6) {
    const step = H / (count - 2);
    let d = "";
    // start from the bottom -- we always want to have one nice pointy chevron there
    for (let i = count - 1; i >= 0; i -= 2) {
        d += path `
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
function lozengy(count = 8) {
    // -1 because we have half of one on the left and half on the right, so we want a _slightly_
    // larger step to make sure we end up spanning the whole width
    const step = W / (count - 1);
    let d = "";
    for (let y = 0; y < (H / W) * count; y += 2) {
        for (let x = 0; x < count; x++) {
            d += path `
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
function paly(count = 6) {
    const step = W / count;
    let d = "";
    for (let x = 1; x < count; x += 2) {
        d += path `
      M ${-W_2 + x * step}        -${H_2}
      L ${-W_2 + x * step}         ${H_2}
      L ${-W_2 + x * step + step}  ${H_2}
      L ${-W_2 + x * step + step} -${H_2}
      Z`;
    }
    return d;
}
const VARIED = {
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
function complexContent(container, content) {
    function renderIntoParent(parent, element) {
        if ("on" in element) {
            on(parent, element);
        }
        else if ("ordinary" in element) {
            parent.appendChild(ORDINARIES[element.ordinary](element.tincture));
        }
        else if ("charge" in element) {
            for (const transform of CHARGE_DIRECTIONS[element.direction ?? "none"][element.count] ?? []) {
                const rendered = CHARGES[element.charge](element.tincture);
                Transform.apply(transform, rendered, element);
                parent.appendChild(rendered);
            }
        }
        else {
            assertNever(element);
        }
    }
    function overwriteCounterchangedTincture(element, tincture) {
        if ("on" in element) {
            if (element.surround?.tincture === COUNTERCHANGED) {
                return {
                    ...element,
                    // Note that we do NOT overwrite the `charge` tincture. That's a function of the `on`, not the field.
                    surround: { ...element.surround, tincture },
                };
            }
        }
        else if ("ordinary" in element) {
            if (element.tincture === COUNTERCHANGED) {
                return { ...element, tincture };
            }
        }
        else if ("charge" in element) {
            if (element.tincture === COUNTERCHANGED) {
                return { ...element, tincture };
            }
        }
        else {
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
            renderIntoParent(g1, overwriteCounterchangedTincture(content.content, content.second));
            renderIntoParent(g2, overwriteCounterchangedTincture(content.content, content.first));
        }
        container.appendChild(g1);
        container.appendChild(g2);
    }
    else if ("quarters" in content) {
        const quartered = {
            1: svg.g(),
            2: svg.g(),
            3: svg.g(),
            4: svg.g(),
        };
        for (const [i_, { translate }] of Object.entries(QUARTERINGS)) {
            const i = +i_;
            applyTransforms(quartered[i], { translate, scale: 0.5 });
            quartered[i].style.clipPath = path `path("
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
    }
    else if ("varied" in content) {
        container.appendChild(field(content.first));
        const second = field(content.second);
        second.style.clipPath = `path("${VARIED[content.varied.type](content.varied.count ?? undefined)}")`;
        container.appendChild(second);
        if (content.content) {
            renderIntoParent(container, content.content);
        }
    }
    else {
        container.appendChild(field(content.tincture));
        if (content.content) {
            renderIntoParent(container, content.content);
        }
    }
}
function on(parent, { ordinary, surround, charge }) {
    const g = svg.g();
    g.appendChild(ORDINARIES[ordinary.ordinary](ordinary.tincture));
    parent.appendChild(g);
    assert(charge.direction == null, 'cannot specify a direction for charges in "on"');
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
        if (DEBUG) {
            const debugPath = svg.path(locator.toSvgPath(), "none");
            debugPath.setAttribute("stroke-width", "2");
            debugPath.setAttribute("stroke", "magenta");
            parent.appendChild(debugPath);
        }
    }
    if (surround) {
        assert(surround.direction == null, 'cannot specify a direction for charges in "between"');
        assert(surround.count != null && surround.count !== 1, "surround charge must have plural count");
        for (const transform of ORDINARIES[ordinary.ordinary].surround[surround.count] ?? []) {
            const c = CHARGES[surround.charge](surround.tincture);
            Transform.apply(transform, c, surround);
            parent.appendChild(c);
        }
    }
}
// ----------------------------------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------------------------------
const input = document.querySelector("#blazon-input");
const form = document.querySelector("#form");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    parseAndRenderBlazon(input.value);
});
for (const example of document.querySelectorAll("a.example")) {
    example.addEventListener("click", (e) => {
        e.preventDefault();
        input.value = e.target.innerHTML;
        parseAndRenderBlazon(input.value);
    });
}
parseAndRenderBlazon(input.value);
