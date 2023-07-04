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

  console.log(result);

  rendered.innerHTML = "";
  render(rendered, result);
}

function render(parent, [type, { count, orientation, fill }, child]) {
  console.log(type, { count, orientation, fill, child });
  SHAPES[type.toLowerCase()](parent, fill);
  if (child) {
    render(parent, child);
  }
}

function field(parent, fill) {
  const p = path(
    "M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z",
    fill
  );
  p.classList.add("stroke-sable");
  parent.style.clipPath =
    'path("M -50 -60 L 50 -60 L 50 -10 C 50 20 30 50 0 60 C -30 50 -50 20 -50 -10 Z")';
  parent.appendChild(p);
}

function bend(parent, fill) {
  parent.append(path("M -61 -60 L 51 72 L 63 60 L -49 -72 Z", fill));
}

function sword(parent, fill) {
  parent.append(
    path(
      "M 35 -2 L 22 -2 L 22 -10 L 18 -10 L 18 -2 L -31 -2 L -35 0 L -31 2 L 18 2 L 18 11 L 22 11 L 22 2 L 35 2 Z",
      fill
    )
  );
}

function fess(parent, fill) {
  parent.append(path("M -50 -20 L 50 -20 L 50 10 L -50 10 Z", fill));
}

function path(d, fill) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.classList.add(`fill-${fill.toLowerCase()}`);
  return path;
}

const SHAPES = {
  field,
  bend,
  sword,
  fess,
};

parseAndRenderBlazon(input.value);
