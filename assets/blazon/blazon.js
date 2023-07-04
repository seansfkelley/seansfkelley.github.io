const input = document.querySelector("#blazon-input");
const refresh = document.querySelector("#refresh");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");

refresh.addEventListener("click", () => {
  parseAndRenderBlazon(input.value);
});

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
  const p = path(
    "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z",
    tincture
  );
  p.classList.add("stroke-sable");
  parent.style.clipPath =
    'path("M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z")';
  parent.appendChild(p);
}

function partyPerField(parent, { dexter, sinister, direction }) {
  // TODO
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
