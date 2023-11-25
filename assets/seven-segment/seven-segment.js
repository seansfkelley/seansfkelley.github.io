const interactive = document.querySelector("#interactive");
const svg = interactive.querySelector("svg");

svg.addEventListener("click", (e) => {
  if (e.target.tagName === "polygon") {
    const segment = e.target.classList.toString();
    if (svg.dataset.segments?.includes(segment)) {
      svg.dataset.segments = svg.dataset.segments.replaceAll(segment, "");
    } else {
      svg.dataset.segments = (svg.dataset.segments ?? "") + segment;
    }
  }
});

interactive.classList.remove("hidden");
