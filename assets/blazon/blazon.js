const input = document.querySelector("#blazon-input");
const refresh = document.querySelector("#refresh");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");

refresh.addEventListener("click", () => {
  parseAndRenderBlazon(input.value);
});

function parseAndRenderBlazon(text) {
  try {
    console.log(parser.parse(text.trim()));
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = e.toString();
    error.style.display = "block";
    console.error("start", e.location.start);
    console.error("end", e.location.end);
    console.error("expected", e.expected);
    return;
  }

  // rendered.innerHTML = "";

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  // TODO: What's the proper blazoning name for this?
  path.classList.add("shield");
  path.setAttribute(
    "d",
    "M 0 0 L 100 0 L 100 50 C 100 80 80 110 50 120 C 20 110 0 80 0 50 Z"
  );
  path.setAttribute("stroke", "#000000");

  rendered.appendChild(path);
}

parseAndRenderBlazon(input.value);
