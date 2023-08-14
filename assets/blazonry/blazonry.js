"use strict";
/*
TODO
-------------------------------------------------------------------------------
- "quarterly" and "party per cross" are synonymous; make them such
- party per ornament: saltire, quarterly
- finish ornament support: saltire
- InDirection -- at least in the case of chevron and saltire, they are rotated to match
- minor visual effects to make it a little less flat
- multiple ordinaries? e.g. "sable a fess argent a saltire gules"
- "overall"
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
  - bavarian arms
    - the "...a lion rampant argent on a canton..." part represents multiple ordinaries in a row; this is unsupported and not the first time I've seen that
  - ???
- embattled ordinaries (chevron, cross counter-embattled) have visible little blips due to the commented-on hack
- remove yOffset from ornaments; it shouldn't be necessary
- add a lexer so the errors have useful names present and don't explode every string literal into characters
- why does the parted show through ordinaries in front of it?
  - Per pale wavy Purpure and Gules on a chief Argent a mullet Sable.
*/
/*
FUTURE WORK and KNOWN ISSUES
-------------------------------------------------------------------------------
- Multiple ordinaries are not supported.
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
*/
// Do this first thing so there's something to see ASAP!
document.querySelector("#no-javascript-alert").remove();
document.querySelector("#interactive").classList.remove("hidden");
// #region LAYOUT
// TODO: Make _everything_ a function of these proportions.
const H = 120;
const H_2 = H / 2;
const W = 100;
const W_2 = W / 2;
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
const UNSUPPORTED = Symbol("unsupported");
const Tincture = {
    NONE: "none",
    COUNTERCHANGED: "counterchanged",
    of: (tincture) => tincture,
};
const Posture = {
    toRadians: (posture) => {
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
const RelativeOrnamentPath = {
    rotate: ([start, main, end], radians) => {
        PathCommand.rotate(start, radians);
        main.forEach((c) => PathCommand.rotate(c, radians));
        PathCommand.rotate(end, radians);
    },
};
const Coordinate = {
    add: (...coordinates) => coordinates.reduce(([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]),
    subtract: (...coordinates) => coordinates.reduce(([x1, y1], [x2, y2]) => [x1 - x2, y1 - y2]),
    length: ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1),
    /**
     * Rotates the given coordinates about the origin.
     */
    rotate: ([x, y], radians) => {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return [x * cos - y * sin, x * sin + y * cos];
    },
    /**
     * Return the angle of the given line segment, in radians. Returns a value on [-pi, pi], according
     * to the relative direction from the first to second point.
     */
    radians: ([x1, y1], [x2, y2]) => {
        if (x1 === x2) {
            // TODO: Confirm this is correct.
            return ((y1 < y2 ? 1 : -1) * Math.PI) / 2;
        }
        else {
            return Math.atan((y2 - y1) / (x2 - x1)) + (x2 < x1 ? Math.PI : 0);
        }
    },
    /**
     * Reflect the coordinate over the given line segment.
     */
    reflect: ([x, y], [x1, y1], [x2, y2]) => {
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
const Quadrilateral = {
    toSvgPath: ([p1, p2, p3, p4]) => {
        return path `
      M ${p1[0]} ${p1[1]}
      L ${p2[0]} ${p2[1]}
      L ${p3[0]} ${p3[1]}
      L ${p4[0]} ${p4[1]}
      Z
    `;
    },
};
const SVG_ELEMENT_TO_COORDINATES = {
    l: (e) => [e.loc],
    L: (e) => [e.loc],
    m: (e) => [e.loc],
    M: (e) => [e.loc],
    c: (e) => [e.c1, e.c2, e.end],
    z: () => [],
    Z: () => [],
};
var PathCommand;
(function (PathCommand) {
    function negateX(e) {
        for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e)) {
            c[0] *= -1;
        }
    }
    PathCommand.negateX = negateX;
    function negateY(e) {
        for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e)) {
            c[1] *= -1;
        }
    }
    PathCommand.negateY = negateY;
    function rotate(e, radians) {
        for (const c of SVG_ELEMENT_TO_COORDINATES[e.type](e)) {
            [c[0], c[1]] = Coordinate.rotate(c, radians);
        }
    }
    PathCommand.rotate = rotate;
})(PathCommand || (PathCommand = {}));
/**
 * Given the line segment defined by src-dst, widen it along the perpendicular into a rotated
 * rectangle. Points are returned in clockwise order from src to dst.
 */
function widen(src, dst, width, linecap = "butt") {
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
function evaluateLineSegment(src, dst, t) {
    assert(t >= 0 && t <= 1, "parameter must be on [0, 1]");
    return [(dst[0] - src[0]) * t + src[0], (dst[1] - src[1]) * t + src[1]];
}
class NullLocator {
    *forCount() {
        // nop
    }
}
class LineSegmentLocator {
    a;
    b;
    scales;
    constructor(a, b, scales) {
        this.a = a;
        this.b = b;
        this.scales = scales;
    }
    *forCount(total) {
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
class SequenceLocator {
    sequence;
    scales;
    exceptions;
    static EMPTY = Symbol("empty");
    constructor(sequence, scales, exceptions = {}) {
        this.sequence = sequence;
        this.scales = scales;
        this.exceptions = exceptions;
        assert(sequence.length === scales.length, "must have the same number of coordinates in sequence as scales");
    }
    *forCount(total) {
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
class ExhaustiveLocator {
    sequences;
    scales;
    constructor(sequences, scales) {
        this.sequences = sequences;
        this.scales = scales;
        assert(sequences.length === scales.length, "must have the same number of sequences as scales");
        for (let i = 0; i < sequences.length; ++i) {
            assert(sequences[i].length === i + 1, `sequence at index ${i} must have ${i + 1} elements`);
        }
    }
    *forCount(total) {
        if (total <= 0 || total > this.sequences.length) {
            return;
        }
        for (const coordinates of this.sequences[total - 1]) {
            yield [coordinates, this.scales[total - 1]];
        }
    }
}
class AlternatingReflectiveLocator {
    delegate;
    a;
    b;
    constructor(delegate, a, b) {
        this.delegate = delegate;
        this.a = a;
        this.b = b;
    }
    *forCount(total) {
        if (total <= 0) {
            return;
        }
        const locations = total % 2 === 1
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
    *reflectSequence(generator) {
        for (const [translate, scale] of generator) {
            yield [Coordinate.reflect(translate, this.a, this.b), scale];
        }
    }
}
class ReflectiveLocator {
    delegate;
    a;
    b;
    constructor(delegate, a, b) {
        this.delegate = delegate;
        this.a = a;
        this.b = b;
    }
    *forCount(total) {
        for (const [translate, scale] of this.delegate.forCount(total)) {
            yield [Coordinate.reflect(translate, this.a, this.b), scale];
        }
    }
}
class OnChevronLocator {
    left;
    midpoint;
    right;
    scales;
    constructor(left, midpoint, right, scales) {
        this.left = left;
        this.midpoint = midpoint;
        this.right = right;
        this.scales = scales;
    }
    *forCount(total) {
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
class DefaultChargeLocator {
    horizontal;
    vertical;
    static ROWS = [
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
    static SCALES = [
        1.5,
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
    constructor(horizontal, vertical) {
        this.horizontal = horizontal;
        this.vertical = vertical;
    }
    *forCount(total) {
        if (total <= 0 || total > DefaultChargeLocator.ROWS.length) {
            return;
        }
        const rows = DefaultChargeLocator.ROWS[total - 1];
        const step = (this.horizontal[1] - this.horizontal[0]) / (rows[0] + 1);
        for (let i = 0; i < rows.length; ++i) {
            const y = ((i + 1) / (rows.length + 1)) * (this.vertical[1] - this.vertical[0]) +
                this.vertical[0];
            // This is a bit weird, and it's different from the LineSegmentLocator. Instead of spacing out
            // each row evenly and individually, we want to make a nice upside-down isoceles triangle:
            // this means that each row must be spaced out equally, in absolute terms. We calculate the
            // spacing (`step`) based on the most crowded row (assumed to be the first one), then here we
            // calculate where each row needs to start in order for this spacing to produce a horizontally-
            // centered row. That is a function of the number of items in this row relative to the number
            // of items in the first row, that is, the row that set the spacing in the first place.
            const offset = this.horizontal[0] + step + (step * (rows[0] - rows[i])) / 2;
            for (let j = 0; j < rows[i]; ++j) {
                yield [[offset + step * j, y], DefaultChargeLocator.SCALES[total - 1]];
            }
        }
    }
}
// #endregion
// #region UTILITIES
// ----------------------------------------------------------------------------
function assert(condition, message) {
    if (!condition) {
        throw new Error(`assertion failure: ${message}`);
    }
}
function assertNever(nope) {
    throw new Error("was not never");
}
function applyTransforms(element, { origin, translate, scale, rotate, } = {}) {
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
function roundToPrecision(n, precision = 0) {
    assert(precision >= 0, "precision must be non-negative"); // It's well-defined, but not useful to me.
    const magnitude = Math.pow(10, precision);
    return Math.round(n * magnitude) / magnitude;
}
const svg = {
    path: (d, tincture) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.classList.add(`fill-${tincture}`);
        return path;
    },
    line: ([x1, y1], [x2, y2], tincture, width = 1, linecap = "butt") => {
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
    rect: ([x1, y1], [x2, y2], tincture) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", `${x1}`);
        rect.setAttribute("y", `${y1}`);
        rect.setAttribute("width", `${x2 - x1}`);
        rect.setAttribute("height", `${y2 - y1}`);
        rect.classList.add(`fill-${tincture}`);
        return rect;
    },
    g: (...children) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        for (const c of children) {
            g.appendChild(c);
        }
        return g;
    },
};
function path(strings, ...values) {
    const parts = [];
    for (let i = 0; i < values.length; ++i) {
        parts.push(strings[i], values[i]);
    }
    parts.push(strings.at(-1));
    return parts.join("").trim().replaceAll("\n", "").replaceAll(/ +/g, " ");
}
path.from = (...elements) => {
    return elements
        .flat()
        .map((e) => `${e.type} ${SVG_ELEMENT_TO_COORDINATES[e.type](e)
        .map(([x, y]) => `${roundToPrecision(x, 3)} ${roundToPrecision(y, 3)}`)
        .join(" ")}`)
        .join(" ");
};
const complexSvgCache = {};
function getComplexSvgSync(kind, variant) {
    const key = variant ? `${kind}-${variant}` : kind;
    if (key in complexSvgCache) {
        return complexSvgCache[key];
    }
    else {
        throw new Error(`still waiting for ${key}.svg to load!`);
    }
}
async function fetchComplexSvg(kind, variant) {
    const key = variant ? `${kind}-${variant}` : kind;
    const response = await fetch(`/assets/blazonry/svg/${key}.svg`);
    const root = new DOMParser().parseFromString(await response.text(), "image/svg+xml").documentElement;
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
function bend({ tincture, cotised, ornament }) {
    const bend = svg.g();
    if (ornament != null) {
        bend.appendChild(svg.path(path.from(relativePathsToClosedLoop(ORNAMENTS[ornament](BEND_LENGTH, -BEND_WIDTH / 2, false, "primary"), 
        // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
        // we traverse around the bend clockwise.
        ORNAMENTS[ornament](-BEND_LENGTH, BEND_WIDTH / 2, true, "secondary", "end"))), tincture));
    }
    else {
        bend.appendChild(svg.line([0, 0], [BEND_LENGTH, 0], tincture, BEND_WIDTH));
    }
    if (cotised != null) {
        const offset = BEND_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
        bend.appendChild(svg.line([0, -offset], [BEND_LENGTH, -offset], cotised, COTISED_WIDTH));
        bend.appendChild(svg.line([0, offset], [BEND_LENGTH, offset], cotised, COTISED_WIDTH));
    }
    applyTransforms(bend, {
        translate: [-W_2, -H_2],
        rotate: Math.PI / 4,
    });
    return svg.g(bend);
}
bend.on = new LineSegmentLocator([-W_2, -H_2], [W_2, -H_2 + W], [0.5, 0.5, 0.5, 0.5, 0.4, 0.35, 0.3, 0.25]);
bend.surround = new AlternatingReflectiveLocator(new ExhaustiveLocator([
    [
        [W_2 - 22, -H_2 + 22], //
    ],
    [
        [W_2 - 35, -H_2 + 15],
        [W_2 - 15, -H_2 + 35],
    ],
    [
        [W_2 - 15, -H_2 + 15],
        [W_2 - 40, -H_2 + 15],
        [W_2 - 15, -H_2 + 40],
    ],
], [0.7, 0.5, 0.4]), [-W_2, -H_2], [W_2, -H_2 + W]);
bend.party = (ornament) => {
    const topLeft = [-W_2, -H_2];
    const topRight = [W_2, -H_2];
    const bottomRight = Coordinate.add(topLeft, [BEND_LENGTH, BEND_LENGTH]);
    if (ornament == null) {
        return [
            { type: "M", loc: topLeft },
            { type: "L", loc: bottomRight },
            { type: "L", loc: topRight },
            { type: "Z" },
        ];
    }
    else {
        const ornamentPath = ORNAMENTS[ornament](BEND_LENGTH, 0, false, "primary", "start");
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
function bendSinister(ordinary) {
    const g = svg.g(bend(ordinary));
    applyTransforms(g, {
        scale: [-1, 1],
    });
    return g;
}
bendSinister.on = new AlternatingReflectiveLocator(bend.on, [0, -H_2], [0, H_2]);
bendSinister.surround = new ReflectiveLocator(bend.surround, [0, -H_2], [0, H_2]);
bendSinister.party = (ornament) => {
    const commands = bend.party(ornament);
    commands.forEach(PathCommand.negateX);
    return commands;
};
const CHIEF_WIDTH = H / 3;
function chief({ tincture, cotised, ornament }) {
    const chief = svg.g();
    if (ornament != null) {
        const [start, main, end] = ORNAMENTS[ornament](-W, CHIEF_WIDTH, true, "primary", "center");
        chief.appendChild(svg.path(path.from({ type: "M", loc: [-W_2, -H_2] }, { type: "L", loc: [W_2, -H_2] }, { type: "l", loc: start.loc }, main, { type: "l", loc: end.loc }), tincture));
    }
    else {
        chief.appendChild(svg.line([-W_2, -H_2 + CHIEF_WIDTH / 2], [W_2, -H_2 + CHIEF_WIDTH / 2], tincture, CHIEF_WIDTH));
    }
    if (cotised != null) {
        chief.append(svg.line([-W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2], [W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2], cotised, COTISED_WIDTH));
    }
    return chief;
}
chief.on = new LineSegmentLocator([-W_2, -H_2 + H_2 / 3], [W_2, -H_2 + H_2 / 3], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]);
chief.surround = new NullLocator();
chief.party = UNSUPPORTED;
const CHEVRON_WIDTH = W / 4;
function chevron({ tincture, cotised, ornament }) {
    const left = [-W_2, -H_2 + W];
    const right = [-W_2 + H, H_2];
    // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
    const mid = [0, -(H_2 - W_2)];
    const chevron = svg.g();
    if (ornament != null) {
        const topLength = Coordinate.length(mid, right) + CHEVRON_WIDTH / 2;
        const bottomLength = Coordinate.length(mid, right) - CHEVRON_WIDTH / 2;
        for (const sign of [-1, 1]) {
            const [topStart, topMain, topEnd] = ORNAMENTS[ornament](topLength, 0, false, "primary", "start");
            const [bottomStart, bottomMain, bottomEnd] = ORNAMENTS[ornament](-bottomLength, 0, true, "secondary", "end");
            const p = svg.path(path.from({ type: "m", loc: topStart.loc }, //
            topMain, {
                type: "l",
                loc: Coordinate.add(topEnd.loc, [0, CHEVRON_WIDTH], bottomStart.loc),
            }, bottomMain, {
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
            { type: "l", loc: [-CHEVRON_WIDTH / 10, 0] }, { type: "z" }), tincture);
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
    }
    else {
        chevron.appendChild(svg.line(left, mid, tincture, CHEVRON_WIDTH, "square"));
        chevron.appendChild(svg.line(mid, right, tincture, CHEVRON_WIDTH, "square"));
    }
    if (cotised != null) {
        // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
        const offset = Math.sin(Math.PI / 4) * CHEVRON_WIDTH + COTISED_WIDTH * 2;
        for (const end of [left, right]) {
            for (const sign of [-1, 1]) {
                chevron.appendChild(svg.line(Coordinate.add(end, [0, sign * offset]), Coordinate.add(mid, [0, sign * offset]), cotised, COTISED_WIDTH, "square"));
            }
        }
    }
    return chevron;
}
chevron.on = new OnChevronLocator([-W_2, W_2 - 10], [0, -10], [W_2, W_2 - 10], [0.4, 0.4, 0.4, 0.4, 0.35, 0.35, 0.3, 0.25]);
chevron.surround = new ExhaustiveLocator([
    [
        [0, H_2 - 25], //
    ],
    [
        [0, H_2 - 25],
        [0, -H_2 + 18],
    ],
    [
        [0, H_2 - 25],
        [-20, -H_2 + 18],
        [20, -H_2 + 18],
    ],
    [
        [0, H_2 - 25],
        [0, -H_2 + 18],
        [-30, -H_2 + 30],
        [30, -H_2 + 30],
    ],
], [0.5, 0.5, 0.5, 0.5]);
chevron.party = (ornament) => {
    const [topLeft, midLeft, mid, midRight, topRight] = [
        [-W_2, -H_2],
        // See the main renderer for how these values are picked.
        [-W_2, -H_2 + W],
        [0, -(H_2 - W_2)],
        [W_2, -H_2 + W],
        [W_2, -H_2],
    ];
    if (ornament == null) {
        return [
            { type: "M", loc: topLeft },
            { type: "L", loc: midLeft },
            { type: "L", loc: mid },
            { type: "L", loc: midRight },
            { type: "L", loc: topRight },
            { type: "Z" },
        ];
    }
    else {
        const [leftStart, leftMain, leftEnd] = ORNAMENTS[ornament](Coordinate.length(midLeft, mid), 0, false, "primary", "end");
        const [rightStart, rightMain, rightEnd] = ORNAMENTS[ornament](Coordinate.length(mid, midRight), 0, false, "primary", "start");
        leftMain.forEach((c) => PathCommand.rotate(c, -Math.PI / 4));
        rightMain.forEach((c) => PathCommand.rotate(c, Math.PI / 4));
        return [
            { type: "M", loc: topLeft },
            { type: "L", loc: midLeft },
            {
                type: "l",
                loc: Coordinate.rotate(Coordinate.add(leftStart.loc, leftEnd.loc), -Math.PI / 4),
            },
            ...leftMain,
            ...rightMain,
            {
                type: "l",
                loc: Coordinate.rotate(Coordinate.add(rightEnd.loc, rightStart.loc), Math.PI / 4),
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
function cross({ tincture, cotised, ornament }) {
    const top = [0, -H_2];
    const bottom = [0, H_2];
    const left = [-W_2, -CROSS_VERTICAL_OFFSET];
    const right = [W_2, -CROSS_VERTICAL_OFFSET];
    const cross = svg.g();
    if (ornament != null) {
        const g = svg.g();
        const hLength = W_2 - CROSS_WIDTH / 2;
        const vLength = H_2 - CROSS_WIDTH / 2 + CROSS_VERTICAL_OFFSET;
        const ornamentations = [
            // Starting on the bottom right, moving around counter-clockwise.
            ORNAMENTS[ornament](-vLength, 0, false, "secondary", "end"),
            ORNAMENTS[ornament](hLength, 0, true, "secondary", "start"),
            straightLineOrnamenter(-CROSS_WIDTH),
            ORNAMENTS[ornament](-hLength, 0, false, "primary", "end"),
            ORNAMENTS[ornament](-vLength, 0, false, "secondary", "start"),
            straightLineOrnamenter(-CROSS_WIDTH),
            ORNAMENTS[ornament](vLength, 0, true, "secondary", "end"),
            ORNAMENTS[ornament](-hLength, 0, false, "primary", "start"),
            straightLineOrnamenter(CROSS_WIDTH),
            ORNAMENTS[ornament](hLength, 0, true, "secondary", "end"),
            ORNAMENTS[ornament](vLength, 0, true, "secondary", "start"),
        ];
        for (const index of [0, 2, 4, 6, 8, 10]) {
            RelativeOrnamentPath.rotate(ornamentations[index], Math.PI / 2);
        }
        g.appendChild(svg.path(path.from(relativePathsToClosedLoop(...ornamentations)), tincture));
        applyTransforms(g, {
            // I _think_ this is the correct offset: the vertical offset is accounted for by being
            // included in the vertical length, and even though the first ornamentation can vary in length
            // depending on the type, the end-alignment means that it'll grow downwards, out of view.
            translate: [CROSS_WIDTH / 2, H_2],
        });
        cross.appendChild(g);
    }
    else {
        cross.appendChild(svg.line(top, bottom, tincture, CROSS_WIDTH));
        cross.appendChild(svg.line(left, right, tincture, CROSS_WIDTH));
    }
    if (cotised != null) {
        const offset = CROSS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
        const mid = [0, -CROSS_VERTICAL_OFFSET];
        for (const [p, [x1sign, y1sign], [x2sign, y2sign]] of [
            [top, [-1, -1], [1, -1]],
            [bottom, [-1, 1], [1, 1]],
            [left, [-1, -1], [-1, 1]],
            [right, [1, 1], [1, -1]],
        ]) {
            cross.appendChild(svg.line(Coordinate.add(p, [offset * x1sign, offset * y1sign]), Coordinate.add(mid, [offset * x1sign, offset * y1sign]), cotised, COTISED_WIDTH, "square"));
            cross.appendChild(svg.line(Coordinate.add(p, [offset * x2sign, offset * y2sign]), Coordinate.add(mid, [offset * x2sign, offset * y2sign]), cotised, COTISED_WIDTH, "square"));
        }
    }
    return cross;
}
cross.on = new SequenceLocator([
    [-H_2 / 2, -CROSS_VERTICAL_OFFSET],
    [H_2 / 2, -CROSS_VERTICAL_OFFSET],
    [0, -H_2 / 2 - CROSS_VERTICAL_OFFSET],
    [0, H_2 / 2 - CROSS_VERTICAL_OFFSET],
    [0, -CROSS_VERTICAL_OFFSET],
], [0.4, 0.4, 0.4, 0.4, 0.4], {
    1: [[0, -CROSS_VERTICAL_OFFSET]],
});
const CROSS_SECTOR_2 = (W - CROSS_WIDTH) / 4;
cross.surround = new SequenceLocator([
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
], [0.5, 0.5, 0.5, 0.5], {
    1: SequenceLocator.EMPTY,
});
// Technically this is synonymous with "quarterly", but the code architecture makes it annoying to
// do that without breaking the abstraction. It'll just be unsupported instead.
cross.party = UNSUPPORTED;
const FESS_WIDTH = W / 3;
const FESS_VERTICAL_OFFSET = -H_2 + FESS_WIDTH * (3 / 2);
function fess({ tincture, cotised, ornament }) {
    const fess = svg.g();
    if (ornament != null) {
        fess.appendChild(svg.path(path.from({
            type: "m",
            loc: [-W_2, FESS_VERTICAL_OFFSET - FESS_WIDTH / 2],
        }, relativePathsToClosedLoop(ORNAMENTS[ornament](W, 0, false, "primary", "center"), [
            { type: "m", loc: [0, 0] },
            [{ type: "l", loc: [0, FESS_WIDTH] }],
            { type: "m", loc: [0, 0] },
        ], ORNAMENTS[ornament](-W, 0, true, "secondary", "center"))), tincture));
    }
    else {
        fess.appendChild(svg.line([-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET], tincture, FESS_WIDTH));
    }
    if (cotised != null) {
        const offset = FESS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
        fess.appendChild(svg.line([-W_2, FESS_VERTICAL_OFFSET - offset], [W_2, FESS_VERTICAL_OFFSET - offset], cotised, COTISED_WIDTH));
        fess.appendChild(svg.line([-W_2, FESS_VERTICAL_OFFSET + offset], [W_2, FESS_VERTICAL_OFFSET + offset], cotised, COTISED_WIDTH));
    }
    return fess;
}
fess.on = new LineSegmentLocator([-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]);
fess.surround = new AlternatingReflectiveLocator(new LineSegmentLocator([-W_2, -H_2 + FESS_WIDTH / 2], [W_2, -H_2 + FESS_WIDTH / 2], [0.6, 0.5, 0.4, 0.4]), [-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET]);
fess.party = (ornament) => {
    const [topLeft, midLeft, midRight, topRight] = [
        { type: "M", loc: [-W_2, -H_2] },
        { type: "L", loc: [-W_2, -H / 10] },
        { type: "L", loc: [W_2, -H / 10] },
        { type: "L", loc: [W_2, -H_2] },
    ];
    if (ornament == null) {
        return [topLeft, midLeft, midRight, topRight, { type: "Z" }];
    }
    else {
        const [start, main, end] = ORNAMENTS[ornament](W, 0, false, "primary", "center");
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
function pale({ tincture, cotised, ornament }) {
    const pale = svg.g();
    if (ornament != null) {
        const p = svg.path(path.from(relativePathsToClosedLoop(ORNAMENTS[ornament](H, -PALE_WIDTH / 2, false, "primary"), 
        // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
        // we traverse around the pale clockwise.
        ORNAMENTS[ornament](-H, PALE_WIDTH / 2, true, "secondary", "end"))), tincture);
        applyTransforms(p, {
            translate: [0, -H_2],
            rotate: Math.PI / 2,
        });
        pale.appendChild(p);
    }
    else {
        pale.appendChild(svg.line([0, -H_2], [0, H_2], tincture, PALE_WIDTH));
    }
    if (cotised != null) {
        const offset = PALE_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
        pale.appendChild(svg.line([offset, -H_2], [offset, H_2], cotised, COTISED_WIDTH));
        pale.appendChild(svg.line([-offset, -H_2], [-offset, H_2], cotised, COTISED_WIDTH));
    }
    return pale;
}
pale.on = new LineSegmentLocator([0, -H_2], [0, H_2], [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]);
pale.surround = new AlternatingReflectiveLocator(new LineSegmentLocator([-W_2 + PALE_WIDTH / 2, -H_2], [-W_2 + PALE_WIDTH / 2, H_2], [0.6, 0.5, 0.4, 0.4]), [0, -H_2], [0, H_2]);
pale.party = (ornament) => {
    const [topLeft, topMid, bottomMid, bottomLeft] = [
        { type: "M", loc: [-W_2, -H_2] },
        { type: "L", loc: [0, -H_2] },
        { type: "L", loc: [0, H_2] },
        { type: "L", loc: [-W_2, H_2] },
    ];
    if (ornament == null) {
        return [topLeft, topMid, bottomMid, bottomLeft, { type: "Z" }];
    }
    else {
        const [start, main, end] = ORNAMENTS[ornament](H, 0, false, "primary", "start");
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
function saltire({ tincture, cotised }) {
    const tl = [-W_2, -H_2];
    const tr = [W_2, -H_2];
    const bl = [-W_2, -H_2 + W];
    const br = [-W_2 + H, H_2];
    const saltire = svg.g();
    saltire.appendChild(svg.line(tl, br, tincture, SALTIRE_WIDTH));
    saltire.appendChild(svg.line(bl, tr, tincture, SALTIRE_WIDTH));
    if (cotised != null) {
        // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
        const offset = Math.sin(Math.PI / 4) * SALTIRE_WIDTH + COTISED_WIDTH * 2;
        // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
        const mid = [0, -(H_2 - W_2)];
        for (const [p, [x1sign, y1sign], [x2sign, y2sign]] of [
            [tl, [-1, 0], [0, -1]],
            [tr, [0, -1], [1, 0]],
            [bl, [-1, 0], [0, 1]],
            [br, [0, 1], [1, 0]],
        ]) {
            saltire.appendChild(svg.line(Coordinate.add(p, [offset * x1sign, offset * y1sign]), Coordinate.add(mid, [offset * x1sign, offset * y1sign]), cotised, COTISED_WIDTH, "square"));
            saltire.appendChild(svg.line(Coordinate.add(p, [offset * x2sign, offset * y2sign]), Coordinate.add(mid, [offset * x2sign, offset * y2sign]), cotised, COTISED_WIDTH, "square"));
        }
    }
    return saltire;
}
saltire.on = new SequenceLocator([
    [-25, -35],
    [25, -35],
    [25, 15],
    [-25, 15],
    [0, -10],
], [0.5, 0.5, 0.5, 0.5, 0.5], {
    1: [[0, -10]],
});
saltire.surround = new SequenceLocator([
    [0, -H_2 + 12],
    [-W_2 + 12, -10],
    [W_2 - 12, -10],
    [0, -H_2 + W - 12],
], [0.5, 0.5, 0.5, 0.5], {
    1: SequenceLocator.EMPTY,
});
saltire.party = (ornament) => {
    const [topLeft, topRight, bottomLeft, bottomRight] = [
        { type: "L", loc: [-W_2, -H_2] },
        { type: "L", loc: [W_2, -H_2] },
        { type: "L", loc: [-W_2, -H_2 + W] },
        { type: "L", loc: [W_2, -H_2 + W] },
    ];
    if (ornament == null) {
        return [
            { type: "M", loc: topLeft.loc },
            bottomRight,
            topRight,
            bottomLeft,
            { type: "Z" },
        ];
    }
    else {
        // TODO: What makes sense here?
        return [];
    }
};
const ORDINARIES = {
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
function rondel({ tincture }) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "20");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.classList.add(`fill-${tincture}`);
    return circle;
}
function mullet({ tincture }) {
    return svg.path(
    // These awkward numbers keep the proportions nice while just filling out a 40x40 square.
    "M 0 -18.8 L 5 -4.6 L 20 -4.6 L 8.4 4.5 L 12.5 18.8 L 0 10.4 L -12.5 18.8 L -8.4 4.5 L -20 -4.6 L -5 -4.6 Z", tincture);
}
function lion({ tincture, armed, langued, pose }) {
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
const CHARGE_DIRECTIONS = {
    none: new DefaultChargeLocator([-W_2, W_2], [-H_2, H_2 - 10]),
    fess: fess.on,
    pale: pale.on,
    bend: bend.on,
    chevron: chevron.on,
    saltire: saltire.on,
    cross: cross.on,
};
const SIMPLE_CHARGES = { rondel, mullet };
// A little unfortunate this dispatching wrapper is necessary, but it's the only way to type-safety
// render based on the string. Throwing all charges, simple and otherwise, into a constant mapping
// together means the inferred type of the function has `never` as the first argument. :(
function renderCharge(charge) {
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
function wrapSimpleOrnamenter(ornamenter, isPatternCycleComposite, onlyRenderPrimary) {
    function mutatinglyApplyTransforms([start, main, end], { invertX = false, invertY = false, yOffset = 0, alignToEnd = false, }) {
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
        start.loc[1] += yOffset;
        end.loc[1] -= yOffset;
        return [start, main, end];
    }
    return (xLength, yOffset, invertY, side, alignment = "start") => {
        const chosenOrnamenter = side !== "primary" && onlyRenderPrimary
            ? straightLineOrnamenter
            : ornamenter;
        const invertX = xLength < 0;
        const length = Math.abs(xLength);
        if (alignment === "start") {
            return mutatinglyApplyTransforms(chosenOrnamenter(length), {
                invertX,
                invertY,
                yOffset,
            });
        }
        else if (alignment === "end") {
            return mutatinglyApplyTransforms(chosenOrnamenter(length), {
                invertX,
                invertY,
                yOffset,
                alignToEnd: true,
            });
        }
        else if (alignment === "center") {
            const [start, firstMain] = mutatinglyApplyTransforms(chosenOrnamenter(length / 2), { alignToEnd: true });
            const [, secondMain, end] = chosenOrnamenter(length / 2);
            return mutatinglyApplyTransforms([start, [...firstMain, ...secondMain], end], { invertX, invertY, yOffset });
        }
        else {
            assertNever(alignment);
        }
    };
}
function relativePathsToClosedLoop(...paths) {
    const commands = [
        paths[0][0],
        ...paths[0][1],
        paths[0][2],
    ];
    for (const [start, middle, end] of paths.slice(1)) {
        const previous = commands.pop();
        assert(previous != null && previous.type === "m", "commands must always end in m");
        commands.push({ type: "l", loc: Coordinate.add(previous.loc, start.loc) }, ...middle, end);
    }
    commands.pop();
    commands.push({ type: "z" });
    return commands;
}
relativePathsToClosedLoop.debug = (...paths) => {
    return paths.flat(2).map((c) => (c.type === "m" ? { ...c, type: "l" } : c));
};
function straightLineOrnamenter(length) {
    return [
        { type: "m", loc: [0, 0] },
        [{ type: "l", loc: [length, 0] }],
        { type: "m", loc: [0, 0] },
    ];
}
function embattled(length) {
    const xStep = W / 12;
    const yStep = xStep / 2;
    const points = [[xStep / 2, 0]];
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
function engrailed(length) {
    const width = W / 6;
    const height = width / 6;
    const iterations = Math.ceil(length / width);
    const curves = [];
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
function indented(length) {
    const size = W / 12;
    const points = [];
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
function wavy(length) {
    const halfWidth = W / 12;
    const curves = [];
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
const ORNAMENTS = {
    embattled: wrapSimpleOrnamenter(embattled, true, true),
    "embattled-counter-embattled": wrapSimpleOrnamenter(embattled, true, false),
    engrailed: wrapSimpleOrnamenter(engrailed, false, false),
    indented: wrapSimpleOrnamenter(indented, true, false),
    wavy: wrapSimpleOrnamenter(wavy, true, false),
};
// #region VARIED
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
// #endregion
// #region HIGHER-ORDER ELEMENTS
// ----------------------------------------------------------------------------
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
const CANTON_SCALE_FACTOR = 1 / 3;
// Note that this clips the bottom of the area. Combined with proportional scaling, this permits us
// to render _most_ things pretty sanely, at the risk of them being slightly off-center or clipped
// since they expect to be rendered in a taller-than-wide rectangle by default.
const CANTON_PATH = path `
  M -${W_2} ${-H_2}
  L  ${W_2} ${-H_2}
  L  ${W_2} ${-H_2 + W}
  L -${W_2} ${-H_2 + W}
  Z
`;
function field(tincture) {
    return svg.rect([-W_2, -H_2], [W_2, H_2], tincture);
}
function complexContent(container, content) {
    function renderIntoParent(parent, element) {
        if ("canton" in element) {
            const g = svg.g();
            applyTransforms(g, { origin: [-W_2, -H_2], scale: CANTON_SCALE_FACTOR });
            g.style.clipPath = `path("${CANTON_PATH}")`;
            g.appendChild(svg.path(CANTON_PATH, element.canton));
            g.classList.add(`fill-${element.canton}`);
            parent.appendChild(g);
            if (element.content) {
                renderIntoParent(g, element.content);
            }
        }
        else if ("on" in element) {
            on(parent, element);
        }
        else if ("ordinary" in element) {
            parent.appendChild(ORDINARIES[element.ordinary](element));
        }
        else if ("charge" in element) {
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
        }
        else {
            assertNever(element);
        }
    }
    function overwriteCounterchangedTincture(element, tincture) {
        function maybeToCounterchanged(t) {
            return (t === Tincture.COUNTERCHANGED ? tincture : t);
        }
        if ("canton" in element) {
            // Cantons cannot be counterchanged; they always have a background and everything on them is
            // relative to their background. Thus, nop.
        }
        else if ("on" in element) {
            if (element.surround?.tincture === Tincture.COUNTERCHANGED) {
                return {
                    ...element,
                    // Note that we do NOT overwrite the `charge` tincture. That's a function of the `on`, not the field.
                    surround: { ...element.surround, tincture },
                };
            }
        }
        else if ("ordinary" in element) {
            return {
                ...element,
                tincture: maybeToCounterchanged(element.tincture),
                cotised: maybeToCounterchanged(element.cotised),
            };
        }
        else if ("charge" in element) {
            return {
                ...element,
                tincture: maybeToCounterchanged(element.tincture),
            };
        }
        else {
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
        if (content.content) {
            renderIntoParent(g1, overwriteCounterchangedTincture(content.content, content.second));
            renderIntoParent(g2, overwriteCounterchangedTincture(content.content, content.first));
        }
        // Add g2 first so that it's underneath g1, which is the only one with a clip path.
        container.appendChild(g2);
        container.appendChild(g1);
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
        let line = svg.line([0, -H_2], [0, H_2], Tincture.of("sable"), 0.5);
        line.setAttribute("vector-effect", "non-scaling-stroke");
        container.appendChild(line);
        line = svg.line([-W_2, 0], [W_2, 0], Tincture.of("sable"), 0.5);
        line.setAttribute("vector-effect", "non-scaling-stroke");
        container.appendChild(line);
    }
    else if ("varied" in content) {
        container.appendChild(field(content.first));
        const second = field(content.second);
        second.style.clipPath = `path("${VARIED[content.varied.type](content.varied.count)}")`;
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
function on(parent, { on, surround, charge }) {
    parent.appendChild(ORDINARIES[on.ordinary](on));
    if (charge != null) {
        assert(charge.direction == null, 'cannot specify a direction for charges in "on"');
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
        assert(surround.direction == null, 'cannot specify a direction for charges in "between"');
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
function recursivelyOmitNullish(value) {
    assert(value != null, "cannot omit nullish root values");
    if (Array.isArray(value)) {
        return value.filter((e) => e != null).map(recursivelyOmitNullish);
    }
    else if (typeof value === "object") {
        const o = {};
        for (const [k, v] of Object.entries(value)) {
            if (v != null) {
                o[k] = recursivelyOmitNullish(v);
            }
        }
        return o;
    }
    else {
        return value;
    }
}
function parseAndRenderBlazon() {
    let result;
    try {
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(input.value.trim().toLowerCase());
        const { results } = parser;
        if (results.length === 0) {
            error.style.display = "block";
            error.innerHTML = "Unexpected end of input.";
            return;
        }
        else if (results.length > 1) {
            error.style.display = "block";
            error.innerHTML = "Ambiguous blazon!";
            return;
        }
        else {
            result = recursivelyOmitNullish(results[0]);
            error.style.display = "none";
        }
    }
    catch (e) {
        error.innerHTML = e.toString();
        error.style.display = "block";
        return;
    }
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
    container.appendChild(field(Tincture.of("argent")));
    complexContent(container, result);
}
const input = document.querySelector("#blazon-input");
const random = document.querySelector("#random-blazon");
const form = document.querySelector("#form");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");
const ast = document.querySelector("#ast");
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
    // 12 chosen empirically. Seems nice.
    const blazon = Unparser(grammar, grammar.ParserStart, 14)
        // This is restatement of the regex rule for acceptable whitespace.
        .replaceAll(/[ \t\n\v\f,;]+/g, " ")
        .trim()
        .replace(/ ?\.?$/, ".")
        .replaceAll(
    // It's REALLY hard to generate a random blazon where counterchanged makes sense, since the
    // grammar does not express a relationship between the context ("party per") and the tincture.
    // Since it's 1/8th of the colors, just ban it to reduce nonsense blazons by a lot.
    /(^| )counterchanged( |\.$)/g, (_, prefix, suffix) => `${prefix}${TINCTURES[Math.floor(Math.random() * TINCTURES.length)]}${suffix}`)
        .replaceAll(TINCTURE_REGEX, (_, prefix, tincture, suffix) => `${prefix}${tincture[0].toUpperCase()}${tincture.slice(1)}${suffix}`)
        .replace(/^./, (l) => l.toUpperCase());
    input.value = blazon;
    parseAndRenderBlazon();
});
for (const example of document.querySelectorAll("[data-example]")) {
    example.addEventListener("click", (e) => {
        e.preventDefault();
        const a = e.target;
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
//# sourceMappingURL=blazonry.js.map