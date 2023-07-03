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
    result = parser.parse(text.trim());
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = e.toString();
    error.style.display = "block";
    console.error("start", e.location?.start);
    console.error("end", e.location?.end);
    console.error("expected", e.expected);
    return;
  }

  rendered.innerHTML = "";
  render(rendered, result);
}

function render(parent, [type, fill, children]) {
  SHAPES[type.toLowerCase()](parent, fill);
  children ??= [];
  for (const c of children) {
    render(parent, c);
  }
}

function field(parent, color) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M 0 0 L 100 0 L 100 50 C 100 80 80 110 50 120 C 20 110 0 80 0 50 Z"
  );
  path.classList.add("stroke-sable");
  path.classList.add(`fill-${color.toLowerCase()}`);
  parent.appendChild(path);
}

function bend(parent, color) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M -12 0 L 100 132 L 112 120 L 0 -12 Z");
  path.classList.add(`fill-${color.toLowerCase()}`);
  parent.append(path);
}

// TODO: This is pretty approximate; make it nicer.
function sword(parent, color) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M 59 -2 L 48 -2 L 48 -9 L 44 -9 L 44 -2 L 3 -2 L 0 0 L 3 2 L 44 2 L 44 9 L 48 9 L 48 2 L 59 2 Z"
  );
  path.classList.add(`fill-${color.toLowerCase()}`);
  parent.append(path);
}

const SHAPES = {
  field,
  bend,
  sword,
};

parseAndRenderBlazon(input.value);
