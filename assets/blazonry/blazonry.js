"use strict";
// TODO
// - finish eyeballing direction/on/surround
// - do actual math instead of eyeballing for direction/on/surround offsets
// - canton
// - posture -- for things like swords, requires resizing
// - fancy paths for leopard's heads and such
// - push elements around when quartering
// - party per field can also have complex content in it
// - minor visual effects to make it a little less flat
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
    return svg.path(path `
      M -59 -51
      L  41  63
      L  59  45
      L -41 -69
      Z
    `, tincture);
}
bend.on = {
    1: [
        Transform.of(0, -3, 0.4), //
    ],
    2: [
        Transform.of(-15, -20, 0.4),
        Transform.of(15, 14, 0.4),
    ],
    3: [
        Transform.of(-25, -32, 0.4),
        Transform.of(0, -3, 0.4),
        Transform.of(24, 24, 0.4),
    ],
    4: [
        Transform.of(-31, -38, 0.4),
        Transform.of(-10, -14, 0.4),
        Transform.of(10, 8, 0.4),
        Transform.of(29, 29, 0.4),
    ],
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
function chevron(tincture) {
    return svg.path(path `
      M  0 -22
      L 55  33
      L 43  45
      L  0   2
      L -43 45
      L -55 33
      Z
    `, tincture);
}
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
function fess(tincture) {
    return svg.path(path `
      M -50 -25
      L  50 -25
      L  50  15
      L -50  15
      Z
    `, tincture);
}
fess.on = {
    1: [
        Transform.of(0, -5, 0.6), //
    ],
    2: [
        Transform.of(-20, -5, 0.6),
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
function saltire(tincture) {
    return svg.path(path `
      M  44 -66
      L  56 -54
      L  12 -10
      L  55  33
      L  43  45
      L   0   2
      L -43  45
      L -55  33
      L -12 -10
      L -56 -54
      L -44 -66
      L  0  -22
      Z
    `, tincture);
}
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
function barry(count) {
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
function barryBendy(count) {
    throw new Error("unimplemented");
}
function bendy(count) {
    throw new Error("unimplemented");
}
function checky(count) {
    // w < h, so we use that to determine step (also it's more intuitive)
    const step = W / count;
    let d = "";
    for (let x = 0; x < count; ++x) {
        for (let y = x % 2; y < (H / W) * count; y += 2) {
            d += path `
        M ${-W_2 + x * step}        ${-H_2 + y * step}
        L ${-W_2 + x * step}        ${-H_2 + y * step + step}
        L ${-W_2 + x * step + step} ${-H_2 + y * step + step}
        L ${-W_2 + x * step + step} ${-H_2 + y * step}
        Z
      `;
        }
    }
    return d;
}
function chevronny(count) {
    throw new Error("unimplemented");
}
function lozengy(count) {
    throw new Error("unimplemented");
}
function paly(count) {
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
        }
        else if ("ordinary" in element) {
            return { ...element, tincture };
        }
        else if ("charge" in element) {
            return { ...element, tincture };
        }
        else {
            assertNever(element);
        }
    }
    if ("direction" in content) {
        const g1 = svg.g();
        const g2 = svg.g();
        [g1.style.clipPath, g2.style.clipPath] =
            PARTY_PER_CLIP_PATHS[content.direction];
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
    }
    else if ("varied" in content) {
        container.appendChild(field(content.first));
        const second = field(content.second);
        second.style.clipPath = `path("${VARIED[content.varied.type](content.varied.count ?? 6)}")`;
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
    for (const transform of ORDINARIES[ordinary.ordinary].on[charge.count] ??
        []) {
        const c = CHARGES[charge.charge](charge.tincture);
        Transform.apply(transform, c, charge);
        parent.appendChild(c);
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
