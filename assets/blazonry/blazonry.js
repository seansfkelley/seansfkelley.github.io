"use strict";
// TODO
// - some introductory text for shapes and colors and keywords with clickable links to demonstrate them
// - posture -- for things like swords, requires resizing
// - posture -- incorrect for swords; we should probably rotate the SVG 90 degress and use that as the base
// - InDirection -- at least in the case of chevron and saltire, they are rotated to match -- matters for swords, at least
// - can party per field have complex content in it?
// - minor visual effects to make it a little less flat
// - fancy paths for fancy charges: lion, leopard's head, eagle, castle, boar, swan, tree, and all their variants
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
const Tincture = {
    NONE: "none",
    COUNTERCHANGED: "counterchanged",
};
const Coordinate = {
    add: ([x1, y1], [x2, y2]) => [
        x1 + x2,
        y1 + y2,
    ],
};
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
        if (total > this.sequences.length) {
            return;
        }
        for (const coordinates of this.sequences[total - 1]) {
            yield [coordinates, this.scales[total - 1]];
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
            yield [this.reflect(translate), scale];
        }
    }
    reflect(coordinate) {
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
        1.1,
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
        if (total > DefaultChargeLocator.ROWS.length) {
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
    g: () => {
        return document.createElementNS("http://www.w3.org/2000/svg", "g");
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
const complexSvgCache = {};
function getComplexSvgSync(name) {
    if (name in complexSvgCache) {
        return complexSvgCache[name];
    }
    else {
        throw new Error(`still waiting for ${name}.svg to load!`);
    }
}
async function fetchComplexSvg(name) {
    const response = await fetch(`/assets/blazonry/svg/${name}.svg`);
    const root = new DOMParser().parseFromString(await response.text(), "image/svg+xml").documentElement;
    const wrapper = svg.g();
    wrapper.classList.add(name);
    for (const c of root.children) {
        wrapper.appendChild(c);
    }
    complexSvgCache[name] = wrapper;
}
// #endregion
// #region ORDINARIES
// ----------------------------------------------------------------------------
const COTISED_WIDTH = W_2 / 10;
function bend({ tincture, cotised }) {
    const bendWidth = W / 3;
    const src = [-W_2, -H_2];
    // Note that this sets width using height; this is because (1) we assume height is larger than
    // width; (2) we want a 45 degree angle; and (3) we want to make sure that in all contexts (like
    // transform-scaled cantons) the bend will definitely reach the edges of the container.
    const dst = [-W_2 + H, H_2];
    const bend = svg.line(src, dst, tincture, bendWidth);
    if (cotised == null) {
        return bend;
    }
    else {
        // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
        const offset = Math.sin(Math.PI / 4) * (bendWidth / 2 + (COTISED_WIDTH * 3) / 2);
        const g = svg.g();
        g.appendChild(bend);
        g.appendChild(svg.line(Coordinate.add(src, [offset, -offset]), Coordinate.add(dst, [offset, -offset]), cotised, COTISED_WIDTH));
        g.appendChild(svg.line(Coordinate.add(src, [-offset, offset]), Coordinate.add(dst, [-offset, offset]), cotised, COTISED_WIDTH));
        return g;
    }
}
bend.on = new LineSegmentLocator([-W_2, -H_2], [W_2, -H_2 + W], [0.5, 0.5, 0.5, 0.5, 0.4, 0.35, 0.3, 0.25]);
bend.surround = new ReflectiveLocator(new ExhaustiveLocator([
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
function chief({ tincture, cotised }) {
    const chiefWidth = H / 3;
    const chief = svg.line([-W_2, -H_2 + chiefWidth / 2], [W_2, -H_2 + chiefWidth / 2], tincture, chiefWidth);
    if (cotised == null) {
        return chief;
    }
    else {
        const g = svg.g();
        g.appendChild(chief);
        g.append(svg.line([-W_2, -H_2 + chiefWidth + (COTISED_WIDTH * 3) / 2], [W_2, -H_2 + chiefWidth + (COTISED_WIDTH * 3) / 2], cotised, COTISED_WIDTH));
        return g;
    }
}
chief.on = new LineSegmentLocator([-W_2, -H_2 + H_2 / 3], [W_2, -H_2 + H_2 / 3], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]);
chief.surround = new NullLocator();
function chevron({ tincture, cotised }) {
    const chevronWidth = W / 4;
    const left = [-W_2, -H_2 + W];
    const right = [-W_2 + H, H_2];
    // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
    const mid = [0, -(H_2 - W_2)];
    const chevron = svg.g();
    chevron.appendChild(svg.line(left, mid, tincture, chevronWidth, "square"));
    chevron.appendChild(svg.line(mid, right, tincture, chevronWidth, "square"));
    if (cotised != null) {
        // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
        const offset = Math.sin(Math.PI / 4) * chevronWidth + COTISED_WIDTH * 2;
        for (const end of [left, right]) {
            for (const sign of [-1, 1]) {
                chevron.appendChild(svg.line(Coordinate.add(end, [0, sign * offset]), Coordinate.add(mid, [0, sign * offset]), tincture, COTISED_WIDTH, "square"));
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
function cross({ tincture, cotised }) {
    const crossWidth = W / 4;
    // 14 is too hardcoded -- should be defined based on W/H ratios instead.
    const horizontalOffset = -14;
    const top = [0, -H_2];
    const bottom = [0, H_2];
    const left = [-W_2, horizontalOffset];
    const right = [W_2, horizontalOffset];
    const cross = svg.g();
    cross.appendChild(svg.line(top, bottom, tincture, crossWidth));
    cross.appendChild(svg.line(left, right, tincture, crossWidth));
    if (cotised != null) {
        const offset = crossWidth / 2 + (COTISED_WIDTH * 3) / 2;
        const mid = [0, horizontalOffset];
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
    [-30, -14],
    [30, -14],
    [0, -44],
    [0, 16],
    [0, -14],
], [0.4, 0.4, 0.4, 0.4, 0.4], {
    1: [[0, -14]],
});
cross.surround = new SequenceLocator([
    [-30, -42],
    [30, -42],
    [30, 12],
    [-30, 12],
], [0.5, 0.5, 0.5, 0.5], {
    1: SequenceLocator.EMPTY,
});
function fess({ tincture, cotised }) {
    const verticalOffset = -H_2 + ((W / 3) * 3) / 2;
    const fessWidth = W / 3;
    const fess = svg.line([-W_2, verticalOffset], [W_2, verticalOffset], tincture, fessWidth);
    if (cotised == null) {
        return fess;
    }
    else {
        const offset = fessWidth / 2 + (COTISED_WIDTH * 3) / 2;
        const g = svg.g();
        g.appendChild(fess);
        g.appendChild(svg.line([-W_2, verticalOffset - offset], [W_2, verticalOffset - offset], cotised, COTISED_WIDTH));
        g.appendChild(svg.line([-W_2, verticalOffset + offset], [W_2, verticalOffset + offset], cotised, COTISED_WIDTH));
        return g;
    }
}
fess.on = new LineSegmentLocator([-W_2, -4], [W_2, -4], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]);
fess.surround = new ReflectiveLocator(new LineSegmentLocator([-W_2, -H_2 + 18], [W_2, -H_2 + 18], [0.6, 0.5, 0.4, 0.4]), [-W_2, -4], [W_2, -4]);
function pale({ tincture, cotised }) {
    const paleWidth = W / 3;
    const pale = svg.line([0, -H_2], [0, H_2], tincture, paleWidth);
    if (cotised == null) {
        return pale;
    }
    else {
        const horizontalOffset = paleWidth / 2 + (COTISED_WIDTH * 3) / 2;
        const g = svg.g();
        g.appendChild(pale);
        g.appendChild(svg.line([-horizontalOffset, -H_2], [-horizontalOffset, H_2], cotised, COTISED_WIDTH));
        g.appendChild(svg.line([horizontalOffset, -H_2], [horizontalOffset, H_2], cotised, COTISED_WIDTH));
        return g;
    }
}
pale.on = new LineSegmentLocator([0, -H_2], [0, H_2], [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]);
pale.surround = new ReflectiveLocator(new LineSegmentLocator([-W_2 + 18, -H_2], [-W_2 + 18, W_2 - 10], [0.6, 0.5, 0.4, 0.4]), [0, -H_2], [0, H_2]);
function saltire({ tincture, cotised }) {
    const saltireWidth = W / 4;
    const tl = [-W_2, -H_2];
    const tr = [W_2, -H_2];
    const bl = [-W_2, -H_2 + W];
    const br = [-W_2 + H, H_2];
    const saltire = svg.g();
    saltire.appendChild(svg.line(tl, br, tincture, saltireWidth));
    saltire.appendChild(svg.line(bl, tr, tincture, saltireWidth));
    if (cotised != null) {
        // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
        const offset = Math.sin(Math.PI / 4) * saltireWidth + COTISED_WIDTH * 2;
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
const ORDINARIES = {
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
function sword({ tincture }) {
    return svg.path("M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z", tincture);
}
function rondel({ tincture }) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "20");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.classList.add(`fill-${tincture}`);
    return circle;
}
function mullet({ tincture }) {
    return svg.path("M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z", tincture);
}
function lion({ tincture, armed, langued }) {
    // TODO: tail is missing highlights
    // TODO: sizing and positioning still seems wrong
    // TODO: coloration should be optional, I guess?
    const lion = getComplexSvgSync("lion").cloneNode(true);
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
// This is weakly-typed. I wasn't able to figure out how define a type that matched the discriminant
// property to a function type that takes that union member. It should be an easy trick with
// `DiscriminateUnion`, but it appears the presence of the string literal union disrciminant on
// `SimpleCharge`
const CHARGES = {
    sword: sword,
    rondel: rondel,
    mullet: mullet,
    lion: lion,
};
// #endregion
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
const CANTON_PATH = path `
  M -${W_2} -${H_2}
  L  ${W_2} -${H_2}
  L  ${W_2}  ${H_2}
  L -${W_2}  ${H_2}
  Z
`;
function field(tincture) {
    return svg.rect([-W_2, -H_2], [W_2, H_2], tincture);
}
function complexContent(container, content) {
    function renderIntoParent(parent, element) {
        if ("canton" in element) {
            const g = svg.g();
            g.setAttribute("transform-origin", `-${W_2} -${H_2}`);
            g.setAttribute("transform", 
            // The non-proportional scaling is a bit weird, but we want to have a square canton. A truly
            // "standards-compliant" implementation would have alternate forms of the ordinaries and
            // charges designed for a square canton, like a square cross. But this is a shortcut we take.
            `scale(${CANTON_SCALE_FACTOR}, ${(CANTON_SCALE_FACTOR * W) / H})`);
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
                const rendered = CHARGES[element.charge](element);
                applyTransforms(rendered, {
                    translate,
                    scale,
                    rotate: element.posture ?? undefined,
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
function on(parent, { on, surround, charge }) {
    parent.appendChild(ORDINARIES[on.ordinary](on));
    if (charge != null) {
        assert(charge.direction == null, 'cannot specify a direction for charges in "on"');
        const locator = ORDINARIES[on.ordinary].on;
        for (const [translate, scale] of locator.forCount(charge.count)) {
            const c = CHARGES[charge.charge](charge);
            applyTransforms(c, {
                translate,
                scale,
                rotate: charge.posture ?? undefined,
            });
            parent.appendChild(c);
        }
    }
    if (surround != null) {
        assert(surround.direction == null, 'cannot specify a direction for charges in "between"');
        const locator = ORDINARIES[on.ordinary].surround;
        for (const [translate, scale] of locator.forCount(surround.count)) {
            const c = CHARGES[surround.charge](surround);
            applyTransforms(c, {
                translate,
                scale,
                rotate: surround.posture ?? undefined,
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
    }
    catch (e) {
        error.innerHTML = e.format([
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
    container.appendChild(field("argent"));
    complexContent(container, result);
}
const input = document.querySelector("#blazon-input");
const form = document.querySelector("#form");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");
const ast = document.querySelector("#ast");
form.addEventListener("submit", (e) => {
    e.preventDefault();
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
parseAndRenderBlazon();
// These files are small and there's not that many of them, so it's easier if we just eagerly
// load of these and then try to access them sync later and hope for the best. Making the ENTIRE
// implementation sync just for this is a passive PITA.
fetchComplexSvg("lion");
// #endregion
