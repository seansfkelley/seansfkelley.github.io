"use strict";
const input = document.querySelector("#blazon-input");
const form = document.querySelector("#form");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");
const Transform = {
    of: (x, y, scale) => ({ x, y, scale }),
};
function assert(condition, message) {
    if (!condition) {
        throw new Error("assertion error");
    }
}
function assertNever(nope) {
    throw new Error("was not never");
}
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
const FIELD_PATH = "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z";
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
    const outline = path(FIELD_PATH, "none");
    outline.classList.add("outline");
    rendered.appendChild(outline);
    // Embed a <g> because it isolates viewBox wierdness when doing clipPaths.
    const container = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rendered.appendChild(container);
    if ("direction" in result) {
        partyPerField(container, result);
    }
    else {
        field(container, result);
    }
    if (result.elements) {
        if ("on" in result.elements) {
            on(container, result.elements);
        }
        else if ("ordinary" in result.elements) {
            ORDINARIES[result.elements.ordinary](container, result.elements);
        }
        else if ("charge" in result.elements) {
            CHARGES[result.elements.charge](container, result.elements);
        }
        else {
            assertNever(result.elements);
        }
    }
}
function field(parent, { tincture }) {
    const p = path(FIELD_PATH, tincture);
    parent.style.clipPath = `path("${FIELD_PATH}")`;
    parent.appendChild(p);
}
function partyPerField(parent, { first, second, direction }) {
    const g1 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g1.appendChild(path(FIELD_PATH, first));
    const g2 = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g2.appendChild(path(FIELD_PATH, second));
    if (direction === "pale") {
        g1.style.clipPath = 'path("M -50 -60 L 0 -60 L 0 60 L -50 60 Z")';
        g2.style.clipPath = 'path("M 0 -60 L 0 60 L 50 60 L 50 -60 Z")';
    }
    else if (direction === "fess") {
        g1.style.clipPath = 'path("M -50 -60 L -50 0 L 50 0 L 50 -60 Z")';
        g2.style.clipPath = 'path("M -50 60 L -50 0 L 50 0 L 50 60 Z")';
    }
    else {
        assertNever(direction);
    }
    parent.appendChild(g1);
    parent.appendChild(g2);
}
// ----------------------------------------------------------------------------
// UTIL
// ----------------------------------------------------------------------------
function path(d, tincture) {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", d);
    path.classList.add(`fill-${tincture}`);
    return path;
}
// ----------------------------------------------------------------------------
// ORDINARIES
// ----------------------------------------------------------------------------
function bend(parent, { tincture }) {
    parent.append(path("M -56 -54 L 44 66 L 56 54 L -44 -66 Z", tincture));
}
bend.on = {
    1: [Transform.of(0, 0)],
    2: [Transform.of(-15, -15), Transform.of(15, 15)],
    3: [Transform.of(-30, -30), Transform.of(0, 0), Transform.of(30, 30)],
};
function chief(parent, { tincture }) {
    parent.append(path("M -50 -60 L -50 -20 L 50 -20 L 50 -60 Z", tincture));
}
function chevron(parent, { tincture }) {
    parent.append(path("M 0 -22 L 55 33 L 43 45 L 0 2 L -43 45 L -55 33 Z", tincture));
}
function cross(parent, { tincture }) {
    parent.append(path("M -10 -60 L 10 -60 L 10 -24 L 50 -24 L 50 -4 L 10 -4 L 10 60 L -10 60 L -10 -4 L -50 -4 L -50 -24 L -10 -24 Z", tincture));
}
function fess(parent, { tincture }) {
    parent.append(path("M -50 -25 L 50 -25 L 50 15 L -50 15 Z", tincture));
}
fess.on = {
    1: [Transform.of(0, 0)],
    2: [Transform.of(-15, 0), Transform.of(15, 0)],
    3: [Transform.of(-30, 0), Transform.of(0, 0), Transform.of(30, 0)],
};
fess.surround = {
    2: [Transform.of(0, -30), Transform.of(0, 30)],
    3: [Transform.of(-15, -30), Transform.of(15, -30), Transform.of(0, 30)],
};
function pale(parent, { tincture }) {
    parent.append(path("M -15 -60 L 15 -60 L 15 60 L -15 60 Z", tincture));
}
function saltire(parent, { tincture }) {
    parent.append(path("M 44 -66 L 56 -54 L 12 -10 L 55 33 L 43 45 L 0 2 L -43 45 L -55 33 L -12 -10 L -56 -54 L -44 -66 L 0 -22 Z", tincture));
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
function sword(parent, { tincture }) {
    parent.append(path("M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z", tincture));
}
function rondel(parent, { tincture }) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", "15");
    circle.setAttribute("cx", "0");
    circle.setAttribute("cy", "0");
    circle.classList.add(`fill-${tincture}`);
    parent.append(circle);
}
function mullet(parent, { tincture }) {
    parent.append(path("M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z", tincture));
}
const CHARGES = {
    sword,
    rondel,
    mullet,
};
// ----------------------------------------------------------------------------
// HIGHER-ORDER/UTILITY
// ----------------------------------------------------------------------------
function on(parent, { ordinary, surround, charge }) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    ORDINARIES[ordinary.ordinary](g, ordinary);
    parent.appendChild(g);
    const { on } = ORDINARIES[ordinary.ordinary];
    for (const { x, y, scale } of on[charge.count]) {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", `translate(${x}, ${y})`);
        // TODO: Scaling.
        CHARGES[charge.charge](g, charge);
        parent.appendChild(g);
    }
    if (surround) {
        const { surround } = ORDINARIES[ordinary.ordinary];
        assert(charge.count != null && charge.count !== 1, "surround charge must have plural count");
        for (const { x, y, scale } of surround[charge.count]) {
            const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            g.setAttribute("transform", `translate(${x}, ${y})`);
            // TODO: Scaling.
            CHARGES[charge.charge](g, charge);
            parent.appendChild(g);
        }
    }
}
parseAndRenderBlazon(input.value);
