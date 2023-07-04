const input = document.querySelector("#blazon-input");
const refresh = document.querySelector("#refresh");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");

refresh.addEventListener("click", () => {
  parseAndRenderBlazon(input.value);
});

const FIELD_PATH =
  "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z";

function parseAndRenderBlazon(text) {
  let result;
  try {
    result = parser.parse(text.trim().toLowerCase());
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = e.toString();
    error.style.display = "block";
    console.error("start", e.location?.start);
    console.error("end", e.location?.end);
    console.error("expected", e.expected);
    return;
  }

  console.log(result);

  rendered.innerHTML = "";
  rendered.appendChild(path(FIELD_PATH, "none")); // To get the outline.
  render(rendered, result);
}

function render(parent, [type, attributes, child]) {
  console.log(type, attributes);
  SHAPES[type](parent, attributes);
  if (child) {
    render(parent, child);
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
  } else if (direction === "fess") {
    g1.style.clipPath = 'path("M -50 -60 L -50 0 L 50 0 L 50 -60 Z")';
    g2.style.clipPath = 'path("M -50 60 L -50 0 L 50 0 L 50 60 Z")';
  } else {
    throw new Error(`unsupported direction ${direction}`);
  }

  parent.appendChild(g1);
  parent.appendChild(g2);
}

function bend(parent, { tincture }) {
  parent.append(path("M -61 -60 L 51 72 L 63 60 L -49 -72 Z", tincture));
}

function sword(parent, { tincture }) {
  parent.append(
    path(
      "M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z",
      tincture
    )
  );
}

function fess(parent, { tincture }) {
  parent.append(path("M -50 -20 L 50 -20 L 50 10 L -50 10 Z", tincture));
}

function rondel(parent, { tincture }) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("r", "15");
  circle.setAttribute("cx", "0");
  circle.setAttribute("cy", "0");
  circle.classList.add(`fill-${tincture}`);
  parent.append(circle);
}

function mullet(parent, { tincture }) {
  parent.append(
    path(
      "M 0 -24 L 6 -7 H 24 L 10 4 L 15 21 L 0 11 L -15 21 L -10 4 L -24 -7 H -6 Z",
      tincture
    )
  );
}

function on(parent, { bg, fg, surround }) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  render(g, bg);
  render(g, fg);
  if (surround) {
    // do something
  }
  parent.appendChild(g);
}

function path(d, tincture) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.classList.add(`fill-${tincture}`);
  return path;
}

const SHAPES = {
  field,
  partyPerField,
  bend,
  sword,
  fess,
  rondel,
  mullet,
  on,
};

parseAndRenderBlazon(input.value);
