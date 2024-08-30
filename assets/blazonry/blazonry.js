"use strict";
/*
WELCOME TO THE MACHINE
-------------------------------------------------------------------------------
I hope you enjoy it. I don't normally write 4000-line files, but I didn't want to set up a whole
deployment pipeline, and it's not _that_ many different concepts. The types help too, right?

FUTURE WORK and KNOWN ISSUES
-------------------------------------------------------------------------------
- In general, more vocabulary (charges, ordinaries, postures, attitudes, treatments, etc.) is always
  welcome.
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
- The error messages are really hard to read. A lexer that properly groups characters into tokens
  would probably help (as right now every character in a literal is its own rule).
- A singular fret should extend to the corners of the containing field, but there's currently no
  facility to treat charges differently depending on their count. (Abstraction break?)
- It would be nice if the shield looked at least a little more realistic.
- When several charges in a row have the same tincture, it is idiomatic to only specify it once at
  the end. The parser does not support that, instead requiring every charge to have a tincture
  specified.
- Some currently-unsupported charges get special layout behavior, for instance, swords on a chevron
  or saltire should be rotated according to their position on the ordinary, rather than always up.
- It's unclear what to do with nested counterchanges. Should this rondel be "invisible" because it
  is counterchanged to match the canton, or should it be counterchanged back to match the field:
    - per bend azure and argent on a canton counterchanged a rondel counterchanged
- Furs are misaligned and the wrong size when applied to some charges or variations.
- Embattled(-counter-embattled) treatments can leave visual artifacts due to a bit of a hack... try:
  - argent a chevron embattled sable
  - argent a cross embattled-counter-embattled sable
- Nested quarterlies can end up too short on along the bottom edge:
  - quarterly third quarterly first and fourth argent second and third gules [second parsing]
- When multiple charges are present, the counts in each row can be specified:
  - argent four rondels gules one two and one
- Mixing counterchanging, partitions and variations is probably unresolvable -- should it flip the
  colors between the two sides, or flip the colors amongst each variation on each side:
  - per pale: barry or and sable, and argent; a rondel counterchanged
- Variations using furs don't render the fur:
  - bendy of eight erminois and azure
- Variated SVG charges don't adhere to the correct number of repeats because they are made of
  multiple parts of different sizes and may be translated/rotated:
  - argent a lion barry of six sable and or

NOTES ON THE IMPLEMENTATION
-------------------------------------------------------------------------------
- I did not want _any_ dependencies except the parser, so I re-rolled some things that probably have
  good library implementations, like SVG element factories and SVG paths.
- There are a number of hardcoded values still present in some of the older graphics.
- An SVG path editor/debugger is an essential tool. I used https://yqnn.github.io/svg-path-editor/.
- The main interfaces are in an awkward relationship that does not reflect the concepts from
  heraldry, but makes _some_ operations easier. I would like to both DRY them up and map them more
  closely. To wit:
  - The various `*Field` types should be combined into a `Field` union and have `charges` pulled
    out to a containing class (`BlazonContent`?) unioned with `Quartered`. Thus, rendering of the
    field would be centralized in `field` rather than smeared across a few places.
  - `On` is not a real thing. Shouldn't `Ordinary` have `between` and `on` charges?
  - Aren't cantons a charge? Why do they get top-level treatment, when escutcheons don't?
  - `PartitionedField` and `VariationField` are highly duplicative, but probably shouldn't be.
  - `Quartered` should be a version of `PartitionedField`... right?
  - The major open question preventing this change is: are there blazons that reuse a partition to
    put charges in the dexter/sinister/chief/base locations? Or would `PartitionedField.charges`
    always be treated the same, location-wise, as `SimpleField.charges`? If so, DRYing up fields
    would mean un-DRYing charge locations in the case of partitioned fields.
*/
// Do this first thing so there's something to see ASAP!
document.querySelector("#no-javascript-alert").remove();
document.querySelector("#interactive").classList.remove("hidden");
if (!(
// Per https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent/Firefox, this is the
// preferred way to sniff Gecko-based browsers.
((navigator.userAgent.includes("Gecko") &&
    navigator.userAgent.includes("rv:")) ||
    // This is a sloppy way to check for Chrome, but I'm mostly interested in identifying Chrome
    // without accidentally including Safari, so this works. It doesn't have to be perfect.
    navigator.userAgent.includes("Chrome/")))) {
    document
        .querySelector("#unsupported-browser-alert")
        .classList.remove("hidden");
}
// #region LAYOUT
// TODO: Make _everything_ a function of these proportions.
const H = 120;
const H_2 = H / 2;
const W = 100;
const W_2 = W / 2;
const UNSUPPORTED = Symbol("unsupported");
const Posture = {
    toRadians: (posture) => {
        switch (posture) {
            case undefined:
                return undefined;
            case "palewise":
                return Radians.ZERO;
            case "fesswise":
                return Radians.NEG_QUARTER_TURN;
            case "bendwise":
                return Radians.NEG_EIGHTH_TURN;
            case "bendwise sinister":
                return Radians.EIGHTH_TURN;
            default:
                assertNever(posture);
        }
    },
};
const Location_ = {
    toOffset: (location) => {
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
const TreatmentRelativePath = {
    offset: (coordinate) => [
        { type: "m", loc: coordinate },
        [{ type: "m", loc: [0, 0] }],
        { type: "m", loc: [0, 0] },
    ],
    line: (line) => [
        { type: "m", loc: [0, 0] },
        [{ type: "l", loc: line }],
        { type: "m", loc: [0, 0] },
    ],
    rotate: ([start, main, end], radians) => {
        PathCommand.rotate(start, radians);
        main.forEach((c) => PathCommand.rotate(c, radians));
        PathCommand.rotate(end, radians);
    },
    toClosedLoop: (...paths) => {
        assert(paths.length > 0, "must have at least one path to render");
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
        return [
            // Always include the first move, which is necessary to make the path valid.
            commands[0],
            ...commands.slice(1).filter(
            // Remove no-op commands just so that the SVG is easier to read and debug.
            (c) => !((c.type === "l" && c.loc[0] === 0 && c.loc[1] === 0) ||
                (c.type === "m" && c.loc[0] === 0 && c.loc[1] === 0))),
        ];
    },
    debugToClosedLoop: (...paths) => {
        return [
            ...paths
                .flat(2)
                .map((c) => (c.type === "m" ? { ...c, type: "l" } : c)),
            { type: "z" },
        ];
    },
};
const Coordinate = {
    add: (...coordinates) => coordinates.reduce(([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]),
    subtract: (...coordinates) => coordinates.reduce(([x1, y1], [x2, y2]) => [x1 - x2, y1 - y2]),
    negate: ([x, y]) => [-x, -y],
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
var PathCommand;
(function (PathCommand) {
    const SVG_ELEMENT_TO_COORDINATES = {
        l: (e) => [e.loc],
        L: (e) => [e.loc],
        m: (e) => [e.loc],
        M: (e) => [e.loc],
        c: (e) => [e.c1, e.c2, e.end],
        C: (e) => [e.c1, e.c2, e.end],
        z: () => [],
        Z: () => [],
    };
    function toDString(commands) {
        return commands
            .flat()
            .map((e) => `${e.type} ${SVG_ELEMENT_TO_COORDINATES[e.type](e)
            .map(([x, y]) => `${roundToPrecision(x, 3)},${roundToPrecision(y, 3)}`)
            .join(" ")
            .trim()}`)
            .join(" ");
    }
    PathCommand.toDString = toDString;
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
function isNotNullish(value) {
    return value != null;
}
let idCounter = 1;
function uniqueId(prefix = "id") {
    return `${prefix}-${idCounter++}`;
}
// Not foolproof, but simple and suitable for us.
function deepEqual(one, two) {
    if (one == null || two == null) {
        return one === two;
    }
    else if (Array.isArray(one) && Array.isArray(two)) {
        return (one.length === two.length && one.every((o, i) => deepEqual(o, two[i])));
    }
    else if (typeof one === "object" && typeof two === "object") {
        const oneKeys = Object.getOwnPropertyNames(one).sort();
        const twoKeys = Object.getOwnPropertyNames(two).sort();
        return (deepEqual(oneKeys, twoKeys) &&
            oneKeys.every((k) => deepEqual(one[k], two[k])));
    }
    else {
        return one === two;
    }
}
function roundUpToEven(n) {
    return n % 2 === 1 ? n + 1 : n;
}
const Radians = {
    ZERO: 0,
    QUARTER_TURN: (Math.PI / 2),
    NEG_QUARTER_TURN: (-Math.PI / 2),
    EIGHTH_TURN: (Math.PI / 4),
    NEG_EIGHTH_TURN: (-Math.PI / 4),
    toDeg: (r) => (r / (2 * Math.PI)) * 360,
};
const Transforms = {
    toString: ({ translate, scale, rotate, skewX }) => {
        return [
            translate != null
                ? `translate(${translate[0]}, ${translate[1]})`
                : undefined,
            typeof scale === "number" && scale !== 1
                ? `scale(${scale})`
                : Array.isArray(scale)
                    ? `scale(${scale[0]}, ${scale[1]})`
                    : undefined,
            rotate != null ? `rotate(${Radians.toDeg(rotate)})` : undefined,
            // TODO: Unsure if this is the correct location for skew to make it less surprising.
            skewX != null ? `skewX(${Radians.toDeg(skewX)})` : undefined,
        ]
            .filter(Boolean)
            .join(" ");
    },
    apply: (element, { origin, ...transforms }) => {
        if (origin != null) {
            element.setAttribute("transform-origin", `${origin[0]} ${origin[1]}`);
        }
        element.setAttribute("transform", Transforms.toString(transforms));
    },
};
function roundToPrecision(n, precision = 0) {
    assert(precision >= 0, "precision must be non-negative"); // It's well-defined, but not useful to me.
    const magnitude = Math.pow(10, precision);
    return Math.round(n * magnitude) / magnitude;
}
function applySvgAttributes(element, attributes) {
    for (const [attribute, value] of Object.entries(attributes)) {
        if (value != null) {
            element.setAttribute(attribute, value.toString());
        }
    }
}
function applyClasses(element, classes) {
    if (classes?.fill != null) {
        element.classList.add(`fill-${classes.fill}`);
    }
    if (classes?.stroke != null) {
        element.classList.add(`stroke-${classes.stroke}`);
    }
}
function maybeAppendChild(parent, child) {
    if (child != null) {
        parent.appendChild(child);
    }
}
const svg = {
    circle: ([cx, cy], r, { fill, classes, } = {}) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", r.toString());
        circle.setAttribute("cx", cx.toString());
        circle.setAttribute("cy", cy.toString());
        applySvgAttributes(circle, { fill });
        applyClasses(circle, classes);
        return circle;
    },
    path: (d, { stroke, strokeWidth = 1, strokeLinecap = "butt", fill, classes, } = {}) => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        applySvgAttributes(path, {
            d: PathCommand.toDString(d),
            "stroke-width": strokeWidth,
            "stroke-linecap": strokeLinecap,
            stroke,
            fill,
        });
        applyClasses(path, classes);
        return path;
    },
    line: ([x1, y1], [x2, y2], { stroke, strokeWidth = 1, strokeLinecap = "butt", vectorEffect, classes, } = {}) => {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        applySvgAttributes(line, {
            x1,
            y1,
            x2,
            y2,
            "stroke-width": strokeWidth,
            "stroke-linecap": strokeLinecap,
            "vector-effect": vectorEffect,
            stroke,
        });
        applyClasses(line, classes);
        return line;
    },
    rect: ([x1, y1], [x2, y2], { fill, stroke, classes, } = {}) => {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        applySvgAttributes(rect, {
            x: x1,
            y: y1,
            width: x2 - x1,
            height: y2 - y1,
            fill,
            stroke,
        });
        applyClasses(rect, classes);
        return rect;
    },
    g: ({ "data-kind": kind = undefined }, ...children) => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        applySvgAttributes(g, { "data-kind": kind });
        g.append(...children.filter(isNotNullish));
        return g;
    },
    pattern: ({ id = uniqueId("pattern"), viewBox, x = 0, y = 0, width, height, preserveAspectRatio, patternTransform, }, ...children) => {
        const pattern = document.createElementNS("http://www.w3.org/2000/svg", "pattern");
        applySvgAttributes(pattern, {
            id,
            // Make sure that the coordinate system is the same as the referent, rather than some kind of
            // scaling. This is what we always want in this project.
            patternUnits: "userSpaceOnUse",
            viewBox: `${viewBox[0][0]} ${viewBox[0][1]} ${viewBox[1][0]} ${viewBox[1][1]}`,
            // W/H offsets so that we start in the top-left corner.
            x,
            y,
            // Tiling size.
            width,
            height,
            preserveAspectRatio,
            patternTransform: patternTransform == null
                ? undefined
                : Transforms.toString(patternTransform),
        });
        pattern.append(...children.filter(isNotNullish));
        return pattern;
    },
    polygon: ({ points, fill, stroke, classes, }) => {
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        applySvgAttributes(polygon, {
            points: points.map(([x, y]) => `${x},${y}`).join(" "),
            fill,
            stroke,
        });
        applyClasses(polygon, classes);
        return polygon;
    },
    mask: ({ id = uniqueId("mask") }, ...children) => {
        const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
        applySvgAttributes(mask, { id });
        mask.append(...children.filter(isNotNullish));
        return mask;
    },
};
const complexSvgCache = {};
async function fetchMutableComplexSvg(kind, variant) {
    const key = variant ? `${kind}-${variant}` : kind;
    if (!(key in complexSvgCache)) {
        complexSvgCache[key] = fetch(`/assets/blazonry/svg/${key}.svg`).then(async (response) => {
            const root = new DOMParser().parseFromString(await response.text(), "image/svg+xml").documentElement;
            const wrapper = svg.g({ "data-kind": key });
            wrapper.classList.add(kind);
            // Shallow copy: appendChild also deletes it from the source node, so this is modifying the
            // collection as we iterate it.
            for (const c of [...root.children]) {
                wrapper.appendChild(c);
            }
            return wrapper;
        });
    }
    const loadedSvg = await complexSvgCache[key];
    return loadedSvg.cloneNode(true);
}
// #endregion
// #region ORDINARIES
// ----------------------------------------------------------------------------
const COTISED_WIDTH = W_2 / 12;
const BEND_WIDTH = W / 3;
// Make sure it's long enough to reach diagonally!
const BEND_LENGTH = Math.hypot(W, W) + BEND_WIDTH / 2;
const bend = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const bend = svg.g({ "data-kind": "bend" }, pattern);
        const treatments = [
            TreatmentRelativePath.offset([0, -BEND_WIDTH / 2]),
            TREATMENTS[treatment ?? "untreated"](BEND_LENGTH, false, "primary"),
            TreatmentRelativePath.line([0, BEND_WIDTH]),
            // Note that top is left-to-right, but bottom is right-to-left. This is to make sure that
            // we traverse around the bend clockwise.
            TREATMENTS[treatment ?? "untreated"](-BEND_LENGTH, true, "secondary", "end"),
        ];
        for (const t of treatments) {
            TreatmentRelativePath.rotate(t, Radians.EIGHTH_TURN);
        }
        bend.appendChild(svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([-W_2, -H_2]), ...treatments), fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(bend, pattern);
            // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
            // I don't understand why this isn't COTISED_WIDTH * 1.5; don't we need to center the draw line
            // in the width of the stroke? It seems to work correctly like this though.
            const offset = (Math.sin(Math.PI / 4) * BEND_WIDTH) / 2 + COTISED_WIDTH;
            bend.appendChild(svg.line([-W_2 + offset, -H_2 - offset], [H - W_2 + offset, H_2 - offset], { ...stroke, strokeWidth: COTISED_WIDTH }));
            bend.appendChild(svg.line([-W_2 - offset, -H_2 + offset], [H - W_2 - offset, H_2 + offset], { ...stroke, strokeWidth: COTISED_WIDTH }));
        }
        return bend;
    },
    on: new LineSegmentLocator([-W_2, -H_2], [W_2, -H_2 + W], [0.5, 0.5, 0.5, 0.5, 0.4, 0.35, 0.3, 0.25]),
    between: new AlternatingReflectiveLocator(new ExhaustiveLocator([
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
    ], [0.7, 0.5, 0.4]), [-W_2, -H_2], [W_2, -H_2 + W]),
    partition(treatment) {
        const topLeft = [-W_2, -H_2];
        const topRight = [W_2, -H_2];
        const bottomRight = Coordinate.add(topLeft, [BEND_LENGTH, BEND_LENGTH]);
        if (treatment == null) {
            return [
                { type: "M", loc: topLeft },
                { type: "L", loc: bottomRight },
                { type: "L", loc: topRight },
                { type: "Z" },
            ];
        }
        else {
            const treatmentPath = TREATMENTS[treatment](BEND_LENGTH, false, "primary", "start");
            TreatmentRelativePath.rotate(treatmentPath, Radians.EIGHTH_TURN);
            return [
                { type: "M", loc: topLeft },
                { type: "l", loc: treatmentPath[0].loc },
                ...treatmentPath[1],
                { type: "l", loc: treatmentPath[2].loc },
                { type: "L", loc: topRight },
                { type: "Z" },
            ];
        }
    },
};
const bendSinister = {
    async render(ordinary) {
        const g = svg.g({ "data-kind": "bend-sinister" }, await bend.render(ordinary));
        Transforms.apply(g, {
            scale: [-1, 1],
        });
        return g;
    },
    on: new ReflectiveLocator(bend.on, [0, -H_2], [0, H_2]),
    between: new ReflectiveLocator(bend.between, [0, -H_2], [0, H_2]),
    partition(treatment) {
        assert(bend.partition != null, "cannot delegate to unsupported partition");
        const commands = bend.partition(treatment);
        commands.forEach(PathCommand.negateX);
        return commands;
    },
};
const CHIEF_WIDTH = H / 3;
const chief = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const chief = svg.g({ "data-kind": "chief" }, pattern);
        const [start, main, end] = TREATMENTS[treatment ?? "untreated"](-W, true, "primary", "center");
        chief.appendChild(svg.path([
            { type: "M", loc: [-W_2, -H_2] },
            { type: "L", loc: [W_2, -H_2] },
            { type: "l", loc: Coordinate.add([0, CHIEF_WIDTH], start.loc) },
            ...main,
            { type: "l", loc: Coordinate.add([0, -CHIEF_WIDTH], end.loc) },
        ], fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(chief, pattern);
            chief.append(svg.line([-W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2], [W_2, -H_2 + CHIEF_WIDTH + (COTISED_WIDTH * 3) / 2], { ...stroke, strokeWidth: COTISED_WIDTH }));
        }
        return chief;
    },
    on: new LineSegmentLocator([-W_2, -H_2 + H_2 / 3], [W_2, -H_2 + H_2 / 3], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]),
    between: new NullLocator(),
    partition: undefined,
};
const CHEVRON_WIDTH = W / 4;
const chevron = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const chevron = svg.g({ "data-kind": "chevron" }, pattern);
        const left = [-W_2, -H_2 + W];
        const right = [-W_2 + H, H_2];
        // Cross at 45 degrees starting from the top edge, so we bias upwards from the center.
        const mid = [0, -(H_2 - W_2)];
        const topLength = Coordinate.length(mid, right) + CHEVRON_WIDTH / 2;
        const bottomLength = Coordinate.length(mid, right) - CHEVRON_WIDTH / 2;
        const topLeft = TREATMENTS[treatment ?? "untreated"](topLength, false, "primary", "end");
        TreatmentRelativePath.rotate(topLeft, Radians.NEG_QUARTER_TURN);
        const topRight = TREATMENTS[treatment ?? "untreated"](topLength, false, "primary", "start");
        const bottomLeft = TREATMENTS[treatment ?? "untreated"](-bottomLength, true, "secondary", "start");
        TreatmentRelativePath.rotate(bottomLeft, Radians.NEG_QUARTER_TURN);
        const bottomRight = TREATMENTS[treatment ?? "untreated"](-bottomLength, true, "secondary", "end");
        const treatments = [
            topRight,
            TreatmentRelativePath.line([0, CHEVRON_WIDTH]),
            bottomRight,
            bottomLeft,
            TreatmentRelativePath.line([-CHEVRON_WIDTH, 0]),
            topLeft,
        ];
        for (const t of treatments) {
            TreatmentRelativePath.rotate(t, Radians.EIGHTH_TURN);
        }
        // n.b. this depends on `topRight`, etc., being a shared reference to the same values in `treatments`.
        {
            const [start, , end] = topRight;
            const originalStart = [...start.loc];
            start.loc = [
                0,
                Math.sign(start.loc[1]) * Math.hypot(start.loc[1], start.loc[1]),
            ];
            end.loc = Coordinate.add(end.loc, originalStart, Coordinate.negate(start.loc));
        }
        {
            const [start, , end] = topLeft;
            const originalEnd = [...end.loc];
            end.loc = [0, Math.sign(end.loc[1]) * Math.hypot(end.loc[1], end.loc[1])];
            start.loc = Coordinate.add(start.loc, originalEnd, Coordinate.negate(end.loc));
        }
        // We don't adjust the endpoints of the bottom edges because due to the vagaries of the way that
        // treatments are rendered, they actually look fine where they meet at the lower/inner corner.
        // Embattled-counter-embattled isn't great, but it would look even worse if we tightened it up
        // like we do to the top side.
        chevron.appendChild(svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([
            0,
            -Math.sqrt((CHEVRON_WIDTH * CHEVRON_WIDTH) / 2) - (H_2 - W_2),
        ]), ...treatments), fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(chevron, pattern);
            // remember: sin(pi/4) = cos(pi/4), so the choice of sin is arbitrary.
            const offset = Math.sin(Math.PI / 4) * CHEVRON_WIDTH + COTISED_WIDTH * 2;
            for (const end of [left, right]) {
                for (const sign of [-1, 1]) {
                    chevron.appendChild(svg.line(Coordinate.add(end, [0, sign * offset]), Coordinate.add(mid, [0, sign * offset]), { ...stroke, strokeWidth: COTISED_WIDTH, strokeLinecap: "square" }));
                }
            }
        }
        return chevron;
    },
    on: new OnChevronLocator([-W_2, W_2 - 10], [0, -10], [W_2, W_2 - 10], [0.4, 0.4, 0.4, 0.4, 0.35, 0.35, 0.3, 0.25]),
    between: new ExhaustiveLocator([
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
    ], [0.5, 0.5, 0.5, 0.5]),
    partition(treatment) {
        const [topLeft, midLeft, mid, midRight, topRight] = [
            [-W_2, -H_2],
            // See the main renderer for how these values are picked.
            [-W_2, -H_2 + W],
            [0, -(H_2 - W_2)],
            [W_2, -H_2 + W],
            [W_2, -H_2],
        ];
        if (treatment == null) {
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
            const [leftStart, leftMain, leftEnd] = TREATMENTS[treatment](Coordinate.length(midLeft, mid), false, "primary", "end");
            const [rightStart, rightMain, rightEnd] = TREATMENTS[treatment](Coordinate.length(mid, midRight), false, "primary", "start");
            leftMain.forEach((c) => PathCommand.rotate(c, Radians.NEG_EIGHTH_TURN));
            rightMain.forEach((c) => PathCommand.rotate(c, Radians.EIGHTH_TURN));
            return [
                { type: "M", loc: topLeft },
                { type: "L", loc: midLeft },
                {
                    type: "l",
                    loc: Coordinate.rotate(Coordinate.add(leftStart.loc, leftEnd.loc), Radians.NEG_EIGHTH_TURN),
                },
                ...leftMain,
                ...rightMain,
                {
                    type: "l",
                    loc: Coordinate.rotate(Coordinate.add(rightEnd.loc, rightStart.loc), Radians.EIGHTH_TURN),
                },
                { type: "L", loc: midRight },
                { type: "L", loc: topRight },
                { type: "Z" },
            ];
        }
    },
};
// Ensure that the sides and top arms are all the same length!
const CROSS_WIDTH = W / 4;
const CROSS_VERTICAL_OFFSET = (H - W) / 2;
const CROSS_SECTOR_2 = (W - CROSS_WIDTH) / 4;
const cross = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration, [W, H], {
            translate: [0, 12],
        });
        const cross = svg.g({ "data-kind": "cross" }, pattern);
        const top = [0, -H_2];
        const bottom = [0, H_2];
        const left = [-W_2, -CROSS_VERTICAL_OFFSET];
        const right = [W_2, -CROSS_VERTICAL_OFFSET];
        const hLength = W_2 - CROSS_WIDTH / 2;
        const vLength = H_2 - CROSS_WIDTH / 2 + CROSS_VERTICAL_OFFSET;
        const treatments = [
            // Starting on the bottom right, moving around counter-clockwise.
            TREATMENTS[treatment ?? "untreated"](-vLength, false, "secondary", "end"),
            TREATMENTS[treatment ?? "untreated"](hLength, true, "secondary", "start"),
            TreatmentRelativePath.line([-CROSS_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](-hLength, false, "primary", "end"),
            TREATMENTS[treatment ?? "untreated"](-vLength, false, "secondary", "start"),
            TreatmentRelativePath.line([-CROSS_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](vLength, true, "secondary", "end"),
            TREATMENTS[treatment ?? "untreated"](-hLength, false, "primary", "start"),
            TreatmentRelativePath.line([CROSS_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](hLength, true, "secondary", "end"),
            TREATMENTS[treatment ?? "untreated"](vLength, true, "secondary", "start"),
        ];
        for (const index of [0, 2, 4, 6, 8, 10]) {
            TreatmentRelativePath.rotate(treatments[index], Radians.QUARTER_TURN);
        }
        cross.appendChild(svg.path(TreatmentRelativePath.toClosedLoop(
        // Offset the path itself rather than translating the entire cross so that fur patterns are
        // not shifted off-center.
        TreatmentRelativePath.offset([CROSS_WIDTH / 2, H_2]), ...treatments), fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(cross, pattern);
            const offset = CROSS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
            const mid = [0, -CROSS_VERTICAL_OFFSET];
            for (const [p, [x1sign, y1sign], [x2sign, y2sign]] of [
                [top, [-1, -1], [1, -1]],
                [bottom, [-1, 1], [1, 1]],
                [left, [-1, -1], [-1, 1]],
                [right, [1, 1], [1, -1]],
            ]) {
                cross.appendChild(svg.line(Coordinate.add(p, [offset * x1sign, offset * y1sign]), Coordinate.add(mid, [offset * x1sign, offset * y1sign]), { ...stroke, strokeWidth: COTISED_WIDTH, strokeLinecap: "square" }));
                cross.appendChild(svg.line(Coordinate.add(p, [offset * x2sign, offset * y2sign]), Coordinate.add(mid, [offset * x2sign, offset * y2sign]), { ...stroke, strokeWidth: COTISED_WIDTH, strokeLinecap: "square" }));
            }
        }
        return cross;
    },
    on: new SequenceLocator([
        [-H_2 / 2, -CROSS_VERTICAL_OFFSET],
        [H_2 / 2, -CROSS_VERTICAL_OFFSET],
        [0, -H_2 / 2 - CROSS_VERTICAL_OFFSET],
        [0, H_2 / 2 - CROSS_VERTICAL_OFFSET],
        [0, -CROSS_VERTICAL_OFFSET],
    ], [0.4, 0.4, 0.4, 0.4, 0.4], {
        1: [[0, -CROSS_VERTICAL_OFFSET]],
    }),
    between: new SequenceLocator([
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
    }),
    // Technically this is synonymous with "quarterly", but the code architecture makes it annoying to
    // do that without breaking the abstraction. It'll just be unsupported instead.
    partition: undefined,
};
const FESS_WIDTH = W / 3;
const FESS_VERTICAL_OFFSET = -H_2 + FESS_WIDTH * (3 / 2);
const fess = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const fess = svg.g({ "data-kind": "fess" }, pattern);
        fess.appendChild(svg.path([
            {
                type: "m",
                loc: [-W_2, FESS_VERTICAL_OFFSET - FESS_WIDTH / 2],
            },
            ...TreatmentRelativePath.toClosedLoop(TREATMENTS[treatment ?? "untreated"](W, false, "primary", "center"), [
                { type: "m", loc: [0, 0] },
                [{ type: "l", loc: [0, FESS_WIDTH] }],
                { type: "m", loc: [0, 0] },
            ], TREATMENTS[treatment ?? "untreated"](-W, true, "secondary", "center")),
        ], fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(fess, pattern);
            const offset = FESS_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
            fess.appendChild(svg.line([-W_2, FESS_VERTICAL_OFFSET - offset], [W_2, FESS_VERTICAL_OFFSET - offset], { ...stroke, strokeWidth: COTISED_WIDTH }));
            fess.appendChild(svg.line([-W_2, FESS_VERTICAL_OFFSET + offset], [W_2, FESS_VERTICAL_OFFSET + offset], { ...stroke, strokeWidth: COTISED_WIDTH }));
        }
        return fess;
    },
    on: new LineSegmentLocator([-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET], [0.6, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.18]),
    between: new AlternatingReflectiveLocator(new LineSegmentLocator([-W_2, -H_2 + FESS_WIDTH / 2], [W_2, -H_2 + FESS_WIDTH / 2], [0.6, 0.5, 0.4, 0.4]), [-W_2, FESS_VERTICAL_OFFSET], [W_2, FESS_VERTICAL_OFFSET]),
    partition(treatment) {
        const [topLeft, midLeft, midRight, topRight] = [
            { type: "M", loc: [-W_2, -H_2] },
            { type: "L", loc: [-W_2, -H / 10] },
            { type: "L", loc: [W_2, -H / 10] },
            { type: "L", loc: [W_2, -H_2] },
        ];
        if (treatment == null) {
            return [topLeft, midLeft, midRight, topRight, { type: "Z" }];
        }
        else {
            const [start, main, end] = TREATMENTS[treatment](W, false, "primary", "center");
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
    },
};
const PALE_WIDTH = W / 3;
const pale = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const pale = svg.g({ "data-kind": "pale" }, pattern);
        const right = TREATMENTS[treatment ?? "untreated"](H, false, "primary");
        TreatmentRelativePath.rotate(right, Radians.QUARTER_TURN);
        // Note that right is left-to-right, but left is right-to-left. This is to make sure that
        // we traverse around the pale clockwise after rotations have been performed.
        const left = TREATMENTS[treatment ?? "untreated"](-H, true, "secondary", "end");
        TreatmentRelativePath.rotate(left, Radians.QUARTER_TURN);
        pale.appendChild(svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([PALE_WIDTH / 2, -H_2]), right, TreatmentRelativePath.line([-PALE_WIDTH, 0]), left), fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(pale, pattern);
            const offset = PALE_WIDTH / 2 + (COTISED_WIDTH * 3) / 2;
            pale.appendChild(svg.line([offset, -H_2], [offset, H_2], {
                ...stroke,
                strokeWidth: COTISED_WIDTH,
            }));
            pale.appendChild(svg.line([-offset, -H_2], [-offset, H_2], {
                ...stroke,
                strokeWidth: COTISED_WIDTH,
            }));
        }
        return pale;
    },
    on: new LineSegmentLocator([0, -H_2], [0, H_2], [0.6, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.2]),
    between: new AlternatingReflectiveLocator(new LineSegmentLocator([-W_2 + PALE_WIDTH / 2, -H_2], [-W_2 + PALE_WIDTH / 2, H_2], [0.6, 0.5, 0.4, 0.4]), [0, -H_2], [0, H_2]),
    partition(treatment) {
        const [topLeft, topMid, bottomMid, bottomLeft] = [
            { type: "M", loc: [-W_2, -H_2] },
            { type: "L", loc: [0, -H_2] },
            { type: "L", loc: [0, H_2] },
            { type: "L", loc: [-W_2, H_2] },
        ];
        if (treatment == null) {
            return [topLeft, topMid, bottomMid, bottomLeft, { type: "Z" }];
        }
        else {
            const [start, main, end] = TREATMENTS[treatment](H, false, "primary", "start");
            TreatmentRelativePath.rotate([start, main, end], Radians.QUARTER_TURN);
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
    },
};
const SALTIRE_WIDTH = W / 4;
const saltire = {
    async render({ coloration, cotised, treatment }) {
        const { fill, pattern } = await resolveColoration(coloration);
        const saltire = svg.g({ "data-kind": "saltire" }, pattern);
        const tl = [-W_2, -H_2];
        const tr = [W_2, -H_2];
        const bl = [W_2 - H, H_2];
        const br = [-W_2 + H, H_2];
        const length = Math.hypot(W_2, W_2);
        const treatments = [
            // Starting on the bottom left moving around clockwise.
            TREATMENTS[treatment ?? "untreated"](length, false, "primary", "end"),
            TREATMENTS[treatment ?? "untreated"](length, false, "secondary", "start"),
            TreatmentRelativePath.line([SALTIRE_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](-length, true, "primary", "end"),
            TREATMENTS[treatment ?? "untreated"](length, false, "primary", "start"),
            TreatmentRelativePath.line([-SALTIRE_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](-length, true, "secondary", "end"),
            TREATMENTS[treatment ?? "untreated"](-length, true, "primary", "start"),
            TreatmentRelativePath.line([-SALTIRE_WIDTH, 0]),
            TREATMENTS[treatment ?? "untreated"](length, false, "secondary", "end"),
            TREATMENTS[treatment ?? "untreated"](-length, true, "secondary", "start"),
        ];
        for (const index of [1, 3, 5, 7, 9]) {
            TreatmentRelativePath.rotate(treatments[index], Radians.NEG_QUARTER_TURN);
        }
        for (const t of treatments) {
            TreatmentRelativePath.rotate(t, Radians.NEG_EIGHTH_TURN);
        }
        saltire.appendChild(svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([
            -W_2 - Math.sqrt((SALTIRE_WIDTH * SALTIRE_WIDTH) / 2),
            W_2 - (H_2 - W_2),
        ]), ...treatments), fill));
        if (cotised != null) {
            const { stroke, pattern } = await resolveColoration(cotised);
            maybeAppendChild(saltire, pattern);
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
                saltire.appendChild(svg.line(Coordinate.add(p, [offset * x1sign, offset * y1sign]), Coordinate.add(mid, [offset * x1sign, offset * y1sign]), { ...stroke, strokeWidth: COTISED_WIDTH, strokeLinecap: "square" }));
                saltire.appendChild(svg.line(Coordinate.add(p, [offset * x2sign, offset * y2sign]), Coordinate.add(mid, [offset * x2sign, offset * y2sign]), { ...stroke, strokeWidth: COTISED_WIDTH, strokeLinecap: "square" }));
            }
        }
        return saltire;
    },
    on: new SequenceLocator([
        [-25, -35],
        [25, -35],
        [25, 15],
        [-25, 15],
        [0, -10],
    ], [0.5, 0.5, 0.5, 0.5, 0.5], {
        1: [[0, -10]],
    }),
    between: new SequenceLocator([
        [0, -H_2 + 12],
        [-W_2 + 12, -10],
        [W_2 - 12, -10],
        [0, -H_2 + W - 12],
    ], [0.5, 0.5, 0.5, 0.5], {
        1: SequenceLocator.EMPTY,
    }),
    partition(treatment) {
        const [topLeft, topRight, bottomLeft, bottomRight] = [
            { type: "L", loc: [-W_2, -H_2] },
            { type: "L", loc: [W_2, -H_2] },
            { type: "L", loc: [-W_2, -H_2 + W] },
            { type: "L", loc: [W_2, -H_2 + W] },
        ];
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
        }
        else {
            const [start1, main1, end1] = TREATMENTS[treatment](Math.hypot(W, W), true, "primary", "center");
            TreatmentRelativePath.rotate([start1, main1, end1], (Radians.EIGHTH_TURN * 3));
            const [start2, main2, end2] = TREATMENTS[treatment](Math.hypot(W, W), true, "primary", "center");
            TreatmentRelativePath.rotate([start2, main2, end2], (Radians.NEG_EIGHTH_TURN * 3));
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
    },
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
async function rondel({ coloration }) {
    const { fill, pattern } = await resolveColoration(coloration, [36, 36], {
        scale: 0.5,
        translate: [0, 11],
    });
    return svg.g({ "data-kind": "rondel" }, pattern, 
    // Not quite the full 40x40. Since these are the more visually heavyweight and fill out their
    // allotted space entirely without natural negative spaces, shrink them so they don't crowd too much.
    svg.circle([0, 0], 18, fill));
}
async function mullet({ coloration }) {
    const { fill, pattern } = await resolveColoration(coloration, [40, 40], {
        scale: 0.4,
        translate: [0, 8],
    });
    return svg.g({ "data-kind": "mullet" }, pattern, svg.path([
        // These awkward numbers keep the proportions nice while just filling out a 40x40 square.
        { type: "M", loc: [0, -18.8] },
        { type: "L", loc: [5, -4.6] },
        { type: "L", loc: [20, -4.6] },
        { type: "L", loc: [8.4, 4.5] },
        { type: "L", loc: [12.5, 18.8] },
        { type: "L", loc: [0, 10.4] },
        { type: "L", loc: [-12.5, 18.8] },
        { type: "L", loc: [-8.4, 4.5] },
        { type: "L", loc: [-20, -4.6] },
        { type: "L", loc: [-5, -4.6] },
        { type: "Z" },
    ], fill));
}
const FRET_WIDTH = 40;
async function fret({ coloration }) {
    const { stroke, pattern } = await resolveColoration(coloration, [
        // Bump the size ever so slightly because the way the math is done, a tiny triangle of the wide
        // stroke dips above/below the stated extents.
        FRET_WIDTH * 1.1,
        FRET_WIDTH * 1.1,
    ]);
    const halfWidth = FRET_WIDTH / 2;
    const thirdWidth = FRET_WIDTH / 3;
    const strokeWidth = 3;
    const outlineWidth = 0.25;
    // This is kind of un-DRY, but this is the best way I determined to do this, when you account for
    // having to duplicate-with-slight-modifications the various elements. A single path almost works,
    // but would still require patching-up of the outline to produce the proper visual layering, and
    // doesn't have a good way to make sure the open ends in the four corners also have an outline.
    return svg.g({ "data-kind": "fret" }, pattern, svg.line([-halfWidth - outlineWidth, -halfWidth - outlineWidth], [halfWidth + outlineWidth, halfWidth + outlineWidth], {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
    }), svg.line([-halfWidth, -halfWidth], [halfWidth, halfWidth], {
        ...stroke,
        strokeWidth,
    }), svg.path([
        { type: "M", loc: [-thirdWidth, 0] },
        { type: "L", loc: [0, -thirdWidth] },
        { type: "L", loc: [thirdWidth, 0] },
        { type: "L", loc: [0, thirdWidth] },
        { type: "Z" },
    ], {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
    }), svg.path([
        { type: "M", loc: [-thirdWidth, 0] },
        { type: "L", loc: [0, -thirdWidth] },
        { type: "L", loc: [thirdWidth, 0] },
        { type: "L", loc: [0, thirdWidth] },
        { type: "Z" },
    ], { ...stroke, strokeWidth: strokeWidth }), svg.line([-halfWidth - outlineWidth, halfWidth + outlineWidth], [halfWidth + outlineWidth, -halfWidth - outlineWidth], {
        strokeWidth: strokeWidth + outlineWidth * 2,
        classes: { stroke: "sable" },
    }), svg.line([-halfWidth, halfWidth], [halfWidth, -halfWidth], {
        ...stroke,
        strokeWidth,
    }), svg.line(
    // Patch up the first line to have it appear over the last one, as is the style.
    [-strokeWidth, -strokeWidth], [strokeWidth, strokeWidth], { strokeWidth: strokeWidth + 0.5, classes: { stroke: "sable" } }), svg.line(
    // Bump this out to be longer so that it doesn't produce visual artifacts.
    [-strokeWidth - 1, -strokeWidth - 1], [strokeWidth + 1, strokeWidth + 1], { ...stroke, strokeWidth }));
}
async function escallop({ coloration }) {
    const { fill, pattern } = await resolveColoration(coloration, [90, 95], {
        translate: [0, -7],
    });
    const escallop = await fetchMutableComplexSvg("escallop");
    maybeAppendChild(escallop, pattern);
    if ("classes" in fill) {
        escallop.classList.add(fill.classes.fill);
    }
    else {
        applySvgAttributes(escallop, fill);
    }
    return escallop;
}
async function fleurDeLys({ coloration }) {
    const { fill, pattern } = await resolveColoration(coloration, [40, 50], {
        translate: [3.5, 5],
    });
    const fleurDeLys = await fetchMutableComplexSvg("fleur-de-lys");
    maybeAppendChild(fleurDeLys, pattern);
    if ("classes" in fill) {
        fleurDeLys.classList.add(fill.classes.fill);
    }
    else {
        applySvgAttributes(fleurDeLys, fill);
    }
    return fleurDeLys;
}
// The lion SVGs are pulled from https://en.wikipedia.org/wiki/Attitude_(heraldry).
// In the future, they should probably be aggressively deduplicated -- whoever made the heads and
// bodies did a good job reusing the same elements across the different images, but at the moment
// we just hardcode each one individually instead of combining N heads * M bodies.
const HORIZONTALLY_STRETCHED_ATTITUDES = new Set([
    "passant",
    "passant-guardant",
    "passant-reguardant",
]);
async function lion({ coloration, armed, langued, attitude, placement, }) {
    const lion = await fetchMutableComplexSvg("lion", attitude);
    const { fill, pattern } = await resolveColoration(coloration);
    maybeAppendChild(lion, pattern);
    if ("classes" in fill) {
        lion.classList.add(fill.classes.fill);
        lion.classList.add(`armed-${armed}`);
        lion.classList.add(`langued-${langued}`);
    }
    else {
        // TODO: How to make sure the lines end up masking, just lighter?
        applySvgAttributes(lion, fill);
        // TODO: This doesn't support armed/langued for furs. Which is... okay?
    }
    if (placement === "pale" && HORIZONTALLY_STRETCHED_ATTITUDES.has(attitude)) {
        // This is a bit of a hack! But it makes the Bavarian arms look a little less stupid overall.
        // Really, the passant variants should be naturally wider, as that is how they are typically shown.
        Transforms.apply(lion, { scale: [2, 1] });
        return svg.g({ "data-kind": "lion" }, lion);
    }
    else {
        return lion;
    }
}
async function escutcheon({ content }) {
    const escutcheon = svg.g({ "data-kind": "escutcheon" }, ...(await escutcheonContent(content)), svg.path(ESCUTCHEON_PATH, { strokeWidth: 2, classes: { stroke: "sable" } }));
    escutcheon.setAttribute("clip-path", `path("${PathCommand.toDString(ESCUTCHEON_PATH)}") view-box`);
    Transforms.apply(escutcheon, {
        scale: 0.35,
    });
    // Charges are scaled according to count and placement, so wrap in an extra layer in order to
    // apply our own scaling.
    return svg.g({ "data-kind": "escutcheon-wrapper" }, escutcheon);
}
const CHARGE_LOCATORS = {
    // The vertical offset here matches the offset for both quarterings and some of the ordinaries
    // (cross, saltire, etc.) so that they all stack neatly vertically over the center.
    none: new DefaultChargeLocator([-W_2, W_2], [-H_2, -H_2 + W]),
    fess: fess.on,
    pale: pale.on,
    bend: bend.on,
    "bend sinister": bendSinister.on,
    chevron: chevron.on,
    saltire: saltire.on,
    cross: cross.on,
};
const SIMPLE_CHARGES = { rondel, mullet, fret, escallop, "fleur-de-lys": fleurDeLys };
// A little unfortunate this dispatching wrapper is necessary, but it's the only way to type-safety
// render based on the string. Throwing all charges, simple and otherwise, into a constant mapping
// together means the inferred type of the function has `never` as the first argument. :(
async function nonOrdinaryCharge(charge) {
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
// #region TINCTURES
// ----------------------------------------------------------------------------
// Hardcoded to match the specifics of this SVG. Calculated with largest/smallest-running-sum of the
// path commands making up the pattern. Note that for doing that calculation, the `c` commands
// should only use every third coordinate, as the first two of each triplet are control points.
const ERMINE_WIDTH = 14.69366;
const ERMINE_HEIGHT = 23.71317;
// Returns a pattern that is centered on the whole shield's width/height. Plan accordingly when
// using scale/transform on the element that refers to this pattern, as it may behave unexpectedly.
async function getErmineTincture(foreground, background) {
    const spacing = ERMINE_WIDTH / 3;
    const topLeft = await fetchMutableComplexSvg("ermine");
    // n.b. fill will be inherited by the copy.
    applyClasses(topLeft, { fill: foreground });
    const bottomRight = topLeft.cloneNode(true);
    Transforms.apply(topLeft, {
        translate: [spacing, spacing],
    });
    Transforms.apply(bottomRight, {
        translate: [3 * spacing + ERMINE_WIDTH, 3 * spacing + ERMINE_HEIGHT],
    });
    const width = 4 * spacing + 2 * ERMINE_WIDTH;
    const height = 4 * spacing + 2 * ERMINE_HEIGHT;
    return svg.pattern({
        viewBox: [
            [0, 0],
            [width, height],
        ],
        x: -W_2,
        y: -H_2,
        // 4 arbitrarily chosen to look nice; .5 so that we use half a tile (each of which has two
        // ermines in it) so the unit of tiling isn't obvious and the whole pattern is vertically
        // centered.
        width: W / 4.5,
        height: (W / 4.5) * (height / width),
    }, svg.rect([0, 0], [width, height], { classes: { fill: background } }), topLeft, bottomRight);
}
function getVairTincture() {
    const width = W / 5;
    const height = H / 6;
    return svg.pattern({
        viewBox: [
            [0, 0],
            [width, height * 2],
        ],
        width,
        height: height * 2,
        x: -width / 2,
        y: -height,
    }, svg.rect([0, 0], [width, height * 2], { classes: { fill: "argent" } }), svg.path([
        // All paths have to start with a move, I guess.
        { type: "M", loc: [0, 0] },
        { type: "l", loc: [width / 4, width / 4] },
        { type: "l", loc: [0, height - width / 2] },
        { type: "l", loc: [width / 4, width / 4] },
        { type: "l", loc: [-width / 2, 0] },
        { type: "z" },
        { type: "M", loc: [width, 0] },
        { type: "l", loc: [-width / 4, width / 4] },
        { type: "l", loc: [0, height - width / 2] },
        { type: "l", loc: [-width / 4, width / 4] },
        { type: "l", loc: [width / 2, 0] },
        { type: "z" },
        { type: "M", loc: [width / 2, height] },
        { type: "l", loc: [-width / 4, width / 4] },
        { type: "l", loc: [0, height - width / 2] },
        { type: "l", loc: [-width / 4, width / 4] },
        { type: "l", loc: [width, 0] },
        { type: "l", loc: [-width / 4, -width / 4] },
        { type: "l", loc: [0, -(height - width / 2)] },
        { type: "z" },
    ], { classes: { fill: "azure" } }));
}
async function resolveColoration(coloration, [width, height] = [W, H], patternTransform = {}) {
    if ("color" in coloration) {
        return {
            fill: { fill: coloration.color },
            stroke: { stroke: coloration.color },
        };
    }
    else if ("tincture" in coloration) {
        const { tincture } = coloration;
        // It has to be rewritten based on the context it's defined in before we attempt to resolve it.
        assert(tincture != "counterchanged", "cannot resolve a counterchanged tincture");
        async function getErmineBasedPattern(foreground, background) {
            const pattern = await getErmineTincture(foreground, background);
            applySvgAttributes(pattern, {
                patternTransform: Transforms.toString(patternTransform),
            });
            const color = `url(#${pattern.id})`;
            return { fill: { fill: color }, stroke: { stroke: color }, pattern };
        }
        function getVairPattern() {
            const pattern = getVairTincture();
            const color = `url(#${pattern.id})`;
            return { fill: { fill: color }, stroke: { stroke: color }, pattern };
        }
        switch (tincture) {
            case "ermine":
                return getErmineBasedPattern("sable", "argent");
            case "ermines":
                return getErmineBasedPattern("argent", "sable");
            case "erminois":
                return getErmineBasedPattern("sable", "or");
            case "pean":
                return getErmineBasedPattern("or", "sable");
            case "vair":
                return getVairPattern();
            default:
                return {
                    fill: { classes: { fill: tincture } },
                    stroke: { classes: { stroke: tincture } },
                };
        }
    }
    else if ("type" in coloration) {
        const count = coloration.count ?? VARIATIONS[coloration.type].defaultCount;
        const pattern = await VARIATIONS[coloration.type].generate({
            ...coloration,
            count,
            width,
            height,
        });
        const color = `url(#${pattern.id})`;
        return {
            fill: { fill: color },
            stroke: { stroke: color },
            pattern,
            nonRepeatingElements: await VARIATIONS[coloration.type].nonRepeatingElements?.({ ...coloration, count, width, height }),
        };
    }
    else {
        assertNever(coloration);
    }
}
// #endregion
// #region TREATMENTS
// ----------------------------------------------------------------------------
function wrapSimpleTreatment(treatment, isPatternCycleComposite, onlyRenderPrimary) {
    function mutatinglyApplyTransforms([start, main, end], { invertX = false, invertY = false, alignToEnd = false, }) {
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
        const chosenTreatment = side !== "primary" && onlyRenderPrimary
            ? (length) => TreatmentRelativePath.line([length, 0])
            : treatment;
        const invertX = xLength < 0;
        const length = Math.abs(xLength);
        if (alignment === "start") {
            return mutatinglyApplyTransforms(chosenTreatment(length), {
                invertX,
                invertY,
            });
        }
        else if (alignment === "end") {
            return mutatinglyApplyTransforms(chosenTreatment(length), {
                invertX,
                invertY,
                alignToEnd: true,
            });
        }
        else if (alignment === "center") {
            const [start, firstMain] = mutatinglyApplyTransforms(chosenTreatment(length / 2), { alignToEnd: true });
            const [, secondMain, end] = chosenTreatment(length / 2);
            return mutatinglyApplyTransforms([start, [...firstMain, ...secondMain], end], { invertX, invertY });
        }
        else {
            assertNever(alignment);
        }
    };
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
const TREATMENTS = {
    "embattled-counter-embattled": wrapSimpleTreatment(embattled, true, false),
    embattled: wrapSimpleTreatment(embattled, true, true),
    engrailed: wrapSimpleTreatment(engrailed, false, false),
    indented: wrapSimpleTreatment(indented, true, false),
    wavy: wrapSimpleTreatment(wavy, true, false),
    untreated: (length) => TreatmentRelativePath.line([length, 0]),
};
// #endregion
// #region VARIATIONS
// ----------------------------------------------------------------------------
// Whether any given treatment of a variation should have the two edges "nesting" (i.e. pointing in
// the same direction) or whether they should be opposing. Basically only exists to make sure that
// wavy variations are aligned so they look like water.
const IS_VARIATION_TREATMENT_ALIGNED = {
    "embattled-counter-embattled": false,
    embattled: false,
    engrailed: false,
    indented: false,
    wavy: true,
    untreated: false,
};
const barry = {
    async generate({ treatment, count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const width = fillWidth * 1.5; // 1.5: overrun to prevent visual artifacts around the left/right edges.
        const height = fillHeight / (count / 2);
        return svg.pattern({
            viewBox: [
                [0, 0],
                [width, height],
            ],
            x: -width / 2,
            y: -(fillHeight / 2) - height / 4,
            width,
            height,
        }, svg.rect([0, 0], [width, height], secondFill), svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([0, height / 4]), TREATMENTS[treatment ?? "untreated"](width, !IS_VARIATION_TREATMENT_ALIGNED[treatment ?? "untreated"], "secondary", "center"), TreatmentRelativePath.line([0, height / 2]), TREATMENTS[treatment ?? "untreated"](-width, false, "primary", "center")), firstFill));
    },
    async nonRepeatingElements({ count, first, second }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        return [
            // Hide dips from e.g. wavy on the top edge.
            svg.rect([-W_2, -H_2], [W_2, -H_2 + H / count / 2], firstFill),
            // Same, but note that the bottom bar changes color depending on the parity.
            svg.rect([-W_2, H_2 - H / count / 2], [W_2, H_2], count % 2 === 0 ? secondFill : firstFill),
        ];
    },
    defaultCount: 6,
};
const barryBendy = {
    async generate({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const size = (2 * fillWidth) / count; // Assume W <= H, so we'll step based on that.
        // This angle allows nice patterning where a 2x2 checkered unit shifts horizontally by half a unit
        // (0.5) for every full checked unit height (2). So it lines up vertically nicely.
        const angle = Math.asin(1 / Math.sqrt(5));
        return svg.pattern({
            viewBox: [
                [0, 0],
                [2, 2],
            ],
            width: size,
            height: size,
            // The height component compensates for the horizontal shift due to the shifting y. Since we
            // skew, shifting by y also shifts horizontally. The chosen angle has a nice 2-to-1 ratio, so
            // we can return the horizontal shift to the center by just dividing by 2. Once there, we
            // shift horizontally according to how many size-sized units we can fit.
            // dead center according to the size, so it's lined up with the edges.
            x: fillHeight / 4 - ((fillWidth / 2) % size),
            y: -fillHeight / 2,
            patternTransform: { skewX: angle },
        }, svg.rect([0, 0], [2, 2], secondFill), svg.rect([0, 0], [1, 1], firstFill), svg.rect([1, 1], [2, 2], firstFill));
    },
    nonRepeatingElements: undefined,
    defaultCount: 8,
};
const bendy = {
    async generate({ treatment, first, second, count, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        // Ensure it's wide enough for the full diagonal extent to avoid any weird artifacting between
        // adjacent repeats of the pattern that would otherwise be visible.
        const width = Math.hypot(fillHeight, fillHeight);
        const height = Math.hypot(fillWidth, fillWidth) / (count / 2);
        return svg.pattern({
            viewBox: [
                [0, 0],
                [width, height],
            ],
            // Offset to hide the horizontal pattern boundary out beyond the clipping zone -- we don't
            // know if the treatment pattern will tile horizontally well as that isn't part of their
            // contract.
            x: -width / 2,
            // n.b. that a vertical offset might help with a visual artifact: "bendy wavy of two" will
            // show the boundary between repeat pattern tiles near the bottom right of the bend.
            width,
            height,
            patternTransform: {
                rotate: Radians.EIGHTH_TURN,
                // Subtract W and H to move the center towards the W x W upper square of the shield, which
                // centers a bend in the top left corner, then offset further by half vertical distance of
                // a bend, which is a quarter of the total vertical distance, where the vertical distance
                // is Pythagoras'd from the width of the bend. But only if we're an even number of bends,
                // otherwise we want to be centered.
                translate: [
                    0,
                    fillWidth / 2 -
                        fillHeight / 2 -
                        (count % 2 === 0 ? Math.sqrt(2 * height * height) / 4 : 0),
                ],
            },
        }, svg.rect([0, 0], [width, height], secondFill), svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([0, height / 4]), TREATMENTS[treatment ?? "untreated"](width, !IS_VARIATION_TREATMENT_ALIGNED[treatment ?? "untreated"], "secondary", "center"), TreatmentRelativePath.line([0, height / 2]), TREATMENTS[treatment ?? "untreated"](-width, false, "primary", "center")), firstFill));
    },
    async nonRepeatingElements({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const bendHeight = Math.hypot(fillWidth, fillWidth) / count;
        // hypot -> hypot transforms back to vertical/horizontal instead of 45 degree space.
        const edgeHeight = Math.hypot(bendHeight / 2, bendHeight / 2);
        return [
            svg.polygon({
                points: [
                    [fillWidth / 2, -fillHeight / 2],
                    [fillWidth / 2, -fillHeight / 2 + edgeHeight],
                    [fillWidth / 2 - edgeHeight, -fillHeight / 2],
                ],
                // I wrote out a table to prove this, but basically, the color of the top right corner only
                // changes every two counts, hence the rounding up to even.
                ...((roundUpToEven(count) / 2) % 2 === 0 ? firstFill : secondFill),
            }),
        ];
    },
    defaultCount: 8,
};
const bendySinister = {
    async generate(variation) {
        const pattern = await bendy.generate(variation);
        const height = Math.hypot(variation.width, variation.width) / (variation.count / 2);
        applySvgAttributes(pattern, {
            // There's no good way to DRY up this calculation and just override the rotation, so we have to
            // restate the translation as well. Unless we want to being doing string manipulation on the
            // transform rule itself (we don't).
            patternTransform: Transforms.toString({
                rotate: Radians.NEG_EIGHTH_TURN,
                translate: [
                    0,
                    variation.width / 2 -
                        variation.height / 2 -
                        (variation.count % 2 === 0
                            ? Math.sqrt(2 * height * height) / 4
                            : 0),
                ],
            }),
        });
        return pattern;
    },
    async nonRepeatingElements({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        // Copy-pasta-signflip from the bendy version. I couldn't think of a good way define this in terms
        // of the result of calling the other function, so I didn't.
        const bendHeight = Math.hypot(fillWidth, fillHeight) / count;
        const edgeHeight = Math.hypot(bendHeight / 2, bendHeight / 2);
        return [
            svg.polygon({
                points: [
                    [-fillWidth / 2, -fillHeight / 2],
                    [-fillWidth / 2, -fillHeight / 2 + edgeHeight],
                    [-fillWidth / 2 + edgeHeight, -fillHeight / 2],
                ],
                ...((roundUpToEven(count) / 2) % 2 === 0 ? firstFill : secondFill),
            }),
        ];
    },
    defaultCount: 8,
};
const checky = {
    async generate({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const size = (2 * fillWidth) / count; // W < H, so we'll step based on that.
        return svg.pattern({
            viewBox: [
                [0, 0],
                [2, 2],
            ],
            width: size,
            height: size,
            x: -fillWidth / 2,
            y: -fillHeight / 2,
        }, svg.rect([0, 0], [2, 2], secondFill), svg.rect([1, 0], [2, 1], firstFill), svg.rect([0, 1], [1, 2], firstFill));
    },
    nonRepeatingElements: undefined,
    defaultCount: 6,
};
const chevronny = {
    async generate({ treatment, first, second, count, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        // -2 because the nature of chevrons means that even if you have exactly `count` bands along the
        // center line, you'll see more off to the sides. -2 empirally splits the difference, where the
        // center line has less but the sides have more and it looks approximately like what you wanted.
        const chevronHeight = fillHeight / (count - 2);
        // The 45 degree angle centered on the midline means the tiling unit needs to be at least w/2
        // tall, but it also needs to snap to a unit of tiling, which is two heights (one on, on off).
        const height = 2 * chevronHeight * Math.ceil(fillWidth / 2 / (2 * chevronHeight));
        // 1.5: overrun to prevent visual artifacts around rounding errors and small-pixel adjustments for
        // alignment among the joints of the various parts.
        const length = Math.hypot(fillWidth / 2, fillWidth / 2) * 1.5;
        const topRight = TREATMENTS[treatment ?? "untreated"](length, false, "primary", "start");
        TreatmentRelativePath.rotate(topRight, Radians.EIGHTH_TURN);
        const bottomRight = TREATMENTS[treatment ?? "untreated"](-length, false, "secondary", "end");
        TreatmentRelativePath.rotate(bottomRight, Radians.EIGHTH_TURN);
        topRight[0].loc = [0, 0];
        bottomRight[2].loc = [0, 0];
        const bottomLeft = TREATMENTS[treatment ?? "untreated"](length, true, "secondary", "start");
        TreatmentRelativePath.rotate(bottomLeft, (Math.PI * (3 / 4)));
        const topLeft = TREATMENTS[treatment ?? "untreated"](-length, true, "primary", "end");
        TreatmentRelativePath.rotate(topLeft, (Math.PI * (3 / 4)));
        bottomLeft[0].loc = [0, 0];
        topLeft[2].loc = [0, 0];
        const template = [
            topRight,
            TreatmentRelativePath.line([0, chevronHeight]),
            bottomRight,
            bottomLeft,
            TreatmentRelativePath.line([0, -chevronHeight]),
            topLeft,
        ];
        const paths = [];
        // Start negative to ensure we render copies in the top left and right corners of the tile. The
        // template is based on the top middle location.
        for (let i = -height / (2 * chevronHeight); i < height / (2 * chevronHeight); ++i) {
            paths.push(svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([
                fillWidth / 2,
                i * 2 * chevronHeight,
            ]), ...template), firstFill));
        }
        return svg.pattern({
            viewBox: [
                [0, 0],
                [fillWidth, height],
            ],
            width: fillWidth,
            height,
            x: -fillWidth / 2,
            y: -fillHeight / 2,
        }, svg.rect([0, 0], [fillWidth, height], secondFill), ...paths);
    },
    nonRepeatingElements: undefined,
    defaultCount: 6,
};
const fusilly = {
    async generate({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const width = fillWidth / count;
        return svg.pattern({
            viewBox: [
                [0, 0],
                [2, 8],
            ],
            x: -width / 2 - fillWidth / 2,
            y: -fillHeight / 2,
            width,
            height: width * 4,
        }, svg.rect([0, 0], [2, 8], secondFill), svg.polygon({
            points: [
                [1, 0],
                [2, 4],
                [1, 8],
                [0, 4],
            ],
            ...firstFill,
        }));
    },
    nonRepeatingElements: undefined,
    defaultCount: 8,
};
// There is no visual reference I could find for this besides the arms of Bavaria, so the precise
// positioning of the variations relative to the corners and edges matches the appearance there.
const fusillyInBends = {
    async generate({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const width = fillWidth / count;
        return svg.pattern({
            viewBox: [
                [0, 0],
                [2, 8],
            ],
            x: -fillWidth / 2,
            y: -fillHeight / 2,
            width,
            height: width * 4,
            patternTransform: {
                rotate: Radians.NEG_EIGHTH_TURN,
                translate: [-width, -width - (fillHeight / 2 - fillWidth / 2)],
            },
        }, svg.rect([0, 0], [2, 8], secondFill), svg.polygon({
            points: [
                [1, 0],
                [2, 4],
                [1, 8],
                [0, 4],
            ],
            ...firstFill,
        }));
    },
    nonRepeatingElements: undefined,
    defaultCount: 8,
};
const lozengy = {
    async generate({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const width = fillWidth / count;
        return svg.pattern({
            viewBox: [
                [0, 0],
                [2, 4],
            ],
            x: -width / 2 - fillWidth / 2,
            y: -fillHeight / 2,
            width,
            height: width * 2,
        }, svg.rect([0, 0], [2, 4], secondFill), svg.polygon({
            points: [
                [1, 0],
                [2, 2],
                [1, 4],
                [0, 2],
            ],
            ...firstFill,
        }));
    },
    nonRepeatingElements: undefined,
    defaultCount: 8,
};
const paly = {
    async generate({ treatment, first, second, count, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        const width = fillWidth / (count / 2);
        const height = fillHeight * 1.5; // 1.5: overrun to prevent visual artifacts around the top/bottom edges.
        const left = TREATMENTS[treatment ?? "untreated"](height, false, "primary", "center");
        TreatmentRelativePath.rotate(left, Radians.QUARTER_TURN);
        const right = TREATMENTS[treatment ?? "untreated"](-height, !IS_VARIATION_TREATMENT_ALIGNED[treatment ?? "untreated"], "secondary", "center");
        TreatmentRelativePath.rotate(right, Radians.QUARTER_TURN);
        return svg.pattern({
            viewBox: [
                [0, 0],
                [width, height],
            ],
            x: -(fillWidth / 2) - width / 4,
            y: -height / 2,
            width,
            height,
        }, svg.rect([0, 0], [width, height], secondFill), svg.path(TreatmentRelativePath.toClosedLoop(TreatmentRelativePath.offset([width / 4, 0]), left, TreatmentRelativePath.line([width / 2, 0]), right), firstFill));
    },
    async nonRepeatingElements({ count, first, second, width: fillWidth, height: fillHeight, }) {
        const { fill: firstFill } = await resolveColoration({ tincture: first });
        const { fill: secondFill } = await resolveColoration({ tincture: second });
        return [
            // Hide dips from e.g. wavy on the left edge.
            svg.rect([-fillWidth / 2, -fillHeight / 2], [-fillWidth / 2 + fillWidth / count / 2, fillHeight / 2], firstFill),
            // Same, but note that the right bar changes color depending on the parity.
            svg.rect([fillWidth / 2 - fillWidth / count / 2, -fillHeight / 2], [fillWidth / 2, fillHeight / 2], count % 2 === 0 ? secondFill : firstFill),
        ];
    },
    defaultCount: 6,
};
const VARIATIONS = {
    barry,
    "barry bendy": barryBendy,
    bendy,
    "bendy sinister": bendySinister,
    checky,
    chevronny,
    fusilly,
    "fusilly in bends": fusillyInBends,
    lozengy,
    paly,
};
// #endregion
// #region HIGHER-ORDER ELEMENTS
// ----------------------------------------------------------------------------
async function field(coloration) {
    const { fill, pattern, nonRepeatingElements } = await resolveColoration(coloration);
    return svg.g({ "data-kind": "field" }, pattern, 
    // Expand the height so that when this is rendered on the extra-tall quarter segments it still fills.
    svg.rect([-W_2, -H_2], [W_2, H_2 + 2 * (H_2 - W_2)], fill), ...(nonRepeatingElements ?? []));
}
const ESCUTCHEON_PATH = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "l", loc: [W, 0] },
    { type: "l", loc: [0, H_2 * (4 / 3)] },
    {
        type: "c",
        c1: [0, H_2 / 3],
        c2: [-W_2 * (2 / 5), H_2 / 2],
        end: [-W_2, H_2 * (2 / 3)],
    },
    {
        type: "c",
        c1: [-W_2 * (3 / 5), -H_2 * (1 / 6)],
        c2: [-W_2, -H_2 / 3],
        end: [-W_2, -H_2 * (2 / 3)],
    },
    { type: "z" },
];
// Note that quarterings are NOT the same size. The top two are clipped to be square and the bottom
// two are made taller to compensate. This means that the cross point of the quarter ends up neatly
// centered underneath centered ordinaries or collections of charges.
const QUARTERINGS = {
    1: { translate: [-W_2 / 2, -H_2 / 2], height: W },
    2: { translate: [W_2 / 2, -H_2 / 2], height: W },
    3: { translate: [-W_2 / 2, (-H_2 + W) / 2], height: H + (H - W) },
    4: { translate: [W_2 / 2, (-H_2 + W) / 2], height: H + (H - W) },
};
const CANTON_SCALE_FACTOR = 1 / 3;
// Note that this clips the bottom of the area. Combined with proportional scaling, this permits us
// to render _most_ things pretty sanely, at the risk of them being slightly off-center or clipped
// since they expect to be rendered in a taller-than-wide rectangle by default.
const CANTON_PATH = [
    { type: "M", loc: [-W_2, -H_2] },
    { type: "l", loc: [W, 0] },
    { type: "l", loc: [0, W] },
    { type: "l", loc: [-W, 0] },
    { type: "z" },
];
async function charge(element) {
    if ("canton" in element) {
        const { fill, pattern } = await resolveColoration(element.canton);
        const canton = svg.g({ "data-kind": "canton" }, pattern);
        Transforms.apply(canton, {
            origin: [-W_2, -H_2],
            scale: CANTON_SCALE_FACTOR,
        });
        canton.style.clipPath = `path("${PathCommand.toDString(CANTON_PATH)}") view-box`;
        canton.appendChild(svg.path(CANTON_PATH, fill));
        for (const c of element.charges ?? []) {
            canton.append(...(await charge(c)));
        }
        return [canton];
    }
    else if ("on" in element) {
        return on(element);
    }
    else if ("ordinary" in element) {
        return [await ORDINARIES[element.ordinary].render(element)];
    }
    else if ("charge" in element) {
        const children = [];
        const locator = CHARGE_LOCATORS[element.placement ?? "none"];
        for (const [translate, scale] of locator.forCount(element.count)) {
            const rendered = await nonOrdinaryCharge(element);
            Transforms.apply(rendered, {
                translate,
                scale,
                rotate: Posture.toRadians(element.posture),
            });
            children.push(rendered);
        }
        return children;
    }
    else {
        assertNever(element);
    }
}
async function escutcheonContent(content) {
    // Note that counterchanging happens shallowly. If you have e.g. "per pale argent and gules on a
    // bend counterchanged a mullet counterchanged", both will receive the _same_ patterning, even
    // though the charge is on top of the ordinary (and could justifiably be re-reversed, matching the
    // background variation).
    function counterchangeCharge(element, coloration) {
        function counterchangeColoration(c) {
            if (c == null || "color" in c || "type" in c) {
                return c;
            }
            else if ("tincture" in c) {
                return c.tincture === "counterchanged" ? coloration : c;
            }
            else {
                assertNever(c);
            }
        }
        function counterchangeOrdinary(ordinary) {
            return {
                ...ordinary,
                // Stupid conditional to preserve absence of field for the purposes of deep equality checks.
                ...("cotised" in ordinary
                    ? { cotised: counterchangeColoration(ordinary.cotised) }
                    : {}),
                coloration: counterchangeColoration(ordinary.coloration),
            };
        }
        function counterchangeNonOrdinaryCharge(charge) {
            if (charge == null) {
                return undefined;
            }
            switch (charge.charge) {
                case "mullet":
                case "rondel":
                case "fleur-de-lys":
                case "escallop":
                case "fret":
                case "lion":
                    return {
                        ...charge,
                        coloration: counterchangeColoration(charge.coloration),
                    };
                case "escutcheon":
                    return charge; // TODO: Unsupported!
                default:
                    assertNever(charge);
            }
        }
        if ("canton" in element) {
            return {
                ...element,
                canton: counterchangeColoration(element.canton),
                // Stupid conditional to preserve absence of field for the purposes of deep equality checks.
                ...("charges" in element
                    ? {
                        charges: element.charges?.map((c) => counterchangeCharge(c, coloration)),
                    }
                    : {}),
            };
        }
        else if ("on" in element) {
            return {
                ...element,
                on: counterchangeOrdinary(element.on),
                // Stupid conditional to preserve absence of field for the purposes of deep equality checks.
                ...("charge" in element
                    ? { charge: counterchangeNonOrdinaryCharge(element.charge) }
                    : {}),
                // Stupid conditional to preserve absence of field for the purposes of deep equality checks.
                ...("surround" in element
                    ? { surround: counterchangeNonOrdinaryCharge(element.surround) }
                    : {}),
            };
        }
        else if ("ordinary" in element) {
            return counterchangeOrdinary(element);
        }
        else if ("charge" in element) {
            return counterchangeNonOrdinaryCharge(element);
        }
        else {
            assertNever(element);
        }
    }
    if ("partition" in content) {
        const { partition } = ORDINARIES[content.partition];
        // This should be prevented in grammar, so this should never fire.
        assert(partition != undefined, "cannot partition with this ordinary");
        const mask = svg.mask({}, svg.path(partition(content.treatment), { fill: "white" }));
        function applyMask(e) {
            applySvgAttributes(e, { mask: `url(#${mask.id})` });
            return e;
        }
        const children = [
            mask,
            // Consider having an inverted mask to apply to this side instead; may avoid small visual
            // artifacts from half of the ordinaries/charges being rendered above a copy of themselves.
            await field(content.second),
            // Masked element has to be on top. Masks are arbitrarily defined to pass through the side
            // considered "first" (dexter, top), so put it afterwards because it's a subset of "second".
            applyMask(await field(content.first)),
        ];
        for (const c of content.charges ?? []) {
            const counterchanged = counterchangeCharge(c, content.first);
            if (deepEqual(c, counterchanged)) {
                children.push(...(await charge(c)));
            }
            else {
                children.push(...(await charge(counterchanged)));
                // This is reversed (counterchanged!) from the field -- second is the one that gets the mask
                // and it must appear later.
                children.push(...(await charge(counterchangeCharge(c, content.second))).map(applyMask));
            }
        }
        return children;
    }
    else if ("quarters" in content) {
        const quartered = {
            1: svg.g({ "data-kind": "quarter-1" }),
            2: svg.g({ "data-kind": "quarter-2" }),
            3: svg.g({ "data-kind": "quarter-3" }),
            4: svg.g({ "data-kind": "quarter-4" }),
        };
        for (const [i_, { translate, height }] of Object.entries(QUARTERINGS)) {
            const i = +i_;
            Transforms.apply(quartered[i], { translate, scale: 0.5 });
            quartered[i].style.clipPath = `path("${PathCommand.toDString([
                { type: "M", loc: [-W_2, -H_2] },
                { type: "l", loc: [W, 0] },
                { type: "l", loc: [0, height] },
                { type: "l", loc: [-W, 0] },
                { type: "z" },
            ])}") view-box`;
        }
        for (const quartering of content.quarters) {
            for (const quarter of quartering.quarters) {
                quartered[quarter].append(...(await escutcheonContent(quartering.content)));
            }
        }
        for (const e of Object.values(quartered)) {
            if (e.children.length === 0) {
                e.appendChild(await field({ tincture: "argent" }));
            }
        }
        const children = [
            ...Object.values(quartered),
            svg.line([0, -H_2], [0, H_2], {
                strokeWidth: 0.5,
                classes: { stroke: "sable" },
                vectorEffect: "non-scaling-stroke",
            }),
            svg.line([-W_2, -H_2 + W_2], [W_2, -H_2 + W_2], {
                strokeWidth: 0.5,
                classes: { stroke: "sable" },
                vectorEffect: "non-scaling-stroke",
            }),
        ];
        if (content.overall) {
            children.push(...(await charge(content.overall)));
        }
        return children;
    }
    else if ("tincture" in content.coloration ||
        "color" in content.coloration) {
        const children = [await field(content.coloration)];
        for (const c of content.charges ?? []) {
            children.push(...(await charge(c)));
        }
        return children;
    }
    else if ("type" in content.coloration) {
        const children = [await field(content.coloration)];
        for (const c of content.charges ?? []) {
            const counterchanged = counterchangeCharge(c, { color: "white" });
            if (deepEqual(c, counterchanged)) {
                children.push(...(await charge(c)));
            }
            else {
                // n.b. we do this in a loop instead of all at once at the end to preserve proper stacking
                // and to make it easier to debug by having a 1:1 mask:charge ratio in the DOM.
                const mask = svg.mask({}, ...(await charge(counterchanged)));
                const counterchangedField = await field({
                    ...content.coloration,
                    first: content.coloration.second,
                    second: content.coloration.first,
                });
                applySvgAttributes(counterchangedField, {
                    "data-kind": "counterchanged-field",
                    mask: `url(#${mask.id})`,
                });
                children.push(mask, counterchangedField);
            }
        }
        return children;
    }
    else {
        assertNever(content.coloration);
    }
}
async function on({ on, surround, charge, }) {
    const children = [await ORDINARIES[on.ordinary].render(on)];
    if (charge != null) {
        if (charge.placement != null) {
            console.warn('cannot specify a placement for charges in "on"');
        }
        const locator = ORDINARIES[on.ordinary].on;
        for (const [translate, scale] of locator.forCount(charge.count)) {
            const c = await nonOrdinaryCharge(charge);
            Transforms.apply(c, {
                translate,
                scale,
                rotate: Posture.toRadians(charge.posture),
            });
            children.push(c);
        }
    }
    if (surround != null) {
        if (surround.placement != null) {
            console.warn('cannot specify a placement for charges in "between"');
        }
        const locator = ORDINARIES[on.ordinary].between;
        for (const [translate, scale] of locator.forCount(surround.count)) {
            const c = await nonOrdinaryCharge(surround);
            Transforms.apply(c, {
                translate,
                scale,
                rotate: Posture.toRadians(surround.posture),
            });
            children.push(c);
        }
    }
    return children;
}
async function inescutcheon({ location, content }) {
    const escutcheon = svg.g({ "data-kind": "inescutcheon" }, ...(await escutcheonContent(content)), svg.path(ESCUTCHEON_PATH, { strokeWidth: 2, classes: { stroke: "sable" } }));
    escutcheon.setAttribute("clip-path", `path("${PathCommand.toDString(ESCUTCHEON_PATH)}") view-box`);
    Transforms.apply(escutcheon, {
        scale: 0.25,
        translate: Location_.toOffset(location),
    });
    return escutcheon;
}
// #endregion
// #region INITIALIZATION
// ----------------------------------------------------------------------------
function recursivelyOmitNullish(value) {
    assert(value != null, "cannot omit nullish root values");
    if (Array.isArray(value)) {
        // Cast: compiler does not know that narrowing `value` to an array means T is an array type.
        return value.filter(isNotNullish).map(recursivelyOmitNullish);
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
function initializePreview() {
    let isBelowMainSvg = false;
    let isAboveFootnotes = true;
    function update() {
        renderedPreviewContainer.classList.toggle("visible", isBelowMainSvg && isAboveFootnotes);
    }
    new IntersectionObserver(([{ isIntersecting, boundingClientRect }]) => {
        // > 0 ensures that we don't show the preview if you're scrolled _above_ the main display.
        isBelowMainSvg = !isIntersecting && boundingClientRect.top < 0;
        update();
    }, 
    // threshold: 1 doesn't work properly if the viewport is smaller than the height of the shield.
    // But this won't happen on any real device.
    { threshold: 1 }).observe(rendered);
    new IntersectionObserver(([{ boundingClientRect }]) => {
        isAboveFootnotes =
            boundingClientRect.top > document.documentElement.clientHeight;
        update();
    }, { threshold: 0 }).observe(document.querySelector(".footnotes"));
}
let previousPrevEventHandler;
let previousNextEventHandler;
async function parseAndRenderBlazon(initialAmbiguousIndex = 0) {
    async function render(blazon, index) {
        blazon = recursivelyOmitNullish(blazon);
        // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
        const container = svg.g({ "data-kind": "container" }, ...(await escutcheonContent(blazon.main)), blazon.inescutcheon != null
            ? await inescutcheon(blazon.inescutcheon)
            : undefined);
        container.style.clipPath = `path("${PathCommand.toDString(ESCUTCHEON_PATH)}") view-box`;
        ast.innerHTML = JSON.stringify(blazon, null, 2);
        rendered.replaceChildren(svg.path(ESCUTCHEON_PATH, {
            strokeWidth: 2,
            classes: { stroke: "sable" },
        }), container);
        const clonedRendered = rendered.cloneNode(true);
        clonedRendered.removeAttribute("id");
        renderedPreviewContainer.replaceChildren(clonedRendered);
        const url = new URL(window.location.href);
        url.hash = JSON.stringify({ text, index });
        history.replaceState(null, "", url);
    }
    let results;
    const text = input.value.trim();
    try {
        const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
        parser.feed(text.toLowerCase());
        results = parser.results;
    }
    catch (e) {
        console.error(e);
        const message = e
            .toString()
            .replaceAll(/("(.)"[ \n$])+/g, (match) => match.replaceAll('" "', ""))
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
    }
    else if (results.length > 1) {
        ambiguousPrev.removeEventListener("click", previousPrevEventHandler);
        ambiguousNext.removeEventListener("click", previousNextEventHandler);
        let ambiguousIndex = initialAmbiguousIndex;
        async function step(sign) {
            ambiguousIndex =
                (ambiguousIndex + sign + results.length) % results.length;
            ambiguousCount.innerHTML = `${ambiguousIndex + 1} / ${results.length}`;
            await render(results[ambiguousIndex], ambiguousIndex);
        }
        previousPrevEventHandler = () => step(-1);
        ambiguousPrev.addEventListener("click", previousPrevEventHandler);
        previousNextEventHandler = () => step(1);
        ambiguousNext.addEventListener("click", previousNextEventHandler);
        step(0);
        error.classList.add("hidden");
        ambiguous.classList.remove("hidden");
    }
    else {
        error.classList.add("hidden");
        ambiguous.classList.add("hidden");
        await render(results[0], undefined);
    }
}
const input = document.querySelector("#blazon-input");
const random = document.querySelector("#random-blazon");
const form = document.querySelector("#form");
const rendered = document.querySelector("#rendered");
const renderedPreviewContainer = document.querySelector("#rendered-preview-container");
const error = document.querySelector("#error");
const ast = document.querySelector("#ast");
const ambiguous = document.querySelector("#ambiguous");
const ambiguousPrev = document.querySelector("#ambiguous-previous");
const ambiguousNext = document.querySelector("#ambiguous-next");
const ambiguousCount = document.querySelector("#ambiguous-count");
input.addEventListener("keydown", async (e) => {
    if (e.code === "Enter" && (e.metaKey || e.shiftKey || e.ctrlKey)) {
        await parseAndRenderBlazon();
    }
});
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await parseAndRenderBlazon();
});
// These must be integers since the implementation uses a multiset to realize the different values.
const TINCTURE_WEIGHTS = {
    // Common colors.
    argent: 8,
    azure: 8,
    gules: 8,
    or: 8,
    sable: 8,
    // Uncommon colors.
    vert: 4,
    purpure: 1,
    cendree: 1,
    // Furs.
    ermine: 2,
    ermines: 1,
    erminois: 1,
    pean: 1,
    vair: 2,
    // It's REALLY hard to generate a random blazon where counterchanged makes sense, since the
    // grammar does not express a relationship between the context ("party per") and the tincture.
    // Just ban it to reduce nonsense blazons by a lot.
    counterchanged: 0,
};
const WEIGHTED_TINCTURE_ARRAY = Object.entries(TINCTURE_WEIGHTS).reduce((prev, [tincture, weight]) => [...prev, ...Array(weight).fill(tincture)], []);
function randomTincture() {
    return WEIGHTED_TINCTURE_ARRAY[Math.floor(Math.random() * WEIGHTED_TINCTURE_ARRAY.length)];
}
const TINCTURES = Object.keys(TINCTURE_WEIGHTS);
const TINCTURE_REGEX = new RegExp(`\\b(${TINCTURES.join("|")})\\b`, "g");
const TINCTURE_PAIR_REGEX = new RegExp(`\\b(${TINCTURES.join("|")}) and (${TINCTURES.join("|")})\\b`, "g");
const TINCTURE_ONLY_SKIP_RATIO = 0.8;
const INESCUTCHEON_SKIP_RATIO = 0.6;
function generateRandomBlazon() {
    function generate() {
        return (
        // 16 chosen empirally. It gets lions, where 12 does not. It produces some kinda bizarre and
        // ugly things, but 20 makes some REALLY ugly things.
        Unparser(grammar, grammar.ParserStart, 16)
            // This is restatement of the regex rule for acceptable whitespace.
            .replaceAll(/[ \t\n\v\f,;:]+/g, " ")
            .trim()
            // Periods are the only punctuation of significance; they separate the main blazon from
            // augmentations.
            .replaceAll(/ ?\./g, ".")
            // Special case as the only tincture that has a different name in code than in the UI.
            .replaceAll(/\bcendrée\b/g, "cendree")
            // Ignore any tinctures generated by the grammar since they are equally likely in all
            // places; instead, rewrite them according to our probabilities.
            .replaceAll(TINCTURE_REGEX, randomTincture)
            .replaceAll(TINCTURE_PAIR_REGEX, (_, first, second) => {
            while (first === second) {
                second = randomTincture();
            }
            return `${first} and ${second}`;
        })
            .replaceAll(TINCTURE_REGEX, 
        // Gross and duplicative, but the entire grammar is written in lowercase and I don't want to
        // sprinkle case-insensitive markers EVERYWHERE just so the tinctures can be generated with
        // typical casing by the unparser.
        (tincture) => `${tincture[0].toUpperCase()}${tincture.slice(1)}`)
            // Re-convert the special case. Note it's capitalized due to the previous transformation.
            .replaceAll(/\bCendree\b/g, "Cendrée")
            .replaceAll(/^.|\. ./g, (l) => l.toUpperCase())
            // Periods are optional when there isn't an inescutcheon, so make sure there's always one.
            .replace(/\.?$/, "."));
    }
    let blazon;
    do {
        blazon = generate();
        const inescutcheonIndex = blazon.indexOf(" An inescutcheon");
        if (inescutcheonIndex !== -1 && Math.random() <= INESCUTCHEON_SKIP_RATIO) {
            blazon = blazon.slice(0, inescutcheonIndex);
        }
    } while ((blazon.match(/^[A-Za-z]+\.$/) &&
        Math.random() <= TINCTURE_ONLY_SKIP_RATIO) ||
        // Quarterly never comes out well.
        blazon.match(/[Qq]uarterly/) ||
        // Arbitrary; chosen because it seems to keep some, uh, variety without going too crazy.
        blazon.length > 160);
    return blazon;
}
random.addEventListener("click", async () => {
    input.value = generateRandomBlazon();
    await parseAndRenderBlazon();
});
for (const example of document.querySelectorAll("[data-example]")) {
    example.addEventListener("click", async (e) => {
        e.preventDefault();
        const a = e.target;
        input.value = a.dataset.example || a.innerHTML;
        await parseAndRenderBlazon();
    });
}
initializePreview();
let text;
let index;
try {
    ({ text, index } = JSON.parse(decodeURIComponent(window.location.hash.slice(1))));
}
catch (e) {
    // ignore and do default thing
}
if (typeof text === "string" &&
    (index === undefined || typeof index === "number")) {
    input.value = text;
    parseAndRenderBlazon(index);
}
else {
    parseAndRenderBlazon();
}
// #endregion
//# sourceMappingURL=blazonry.js.map