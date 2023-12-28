const SVGS = {
  // Note that these are NOT the "native" viewBoxes of the relevant SVGs. They have been empiracally
  // tweaked to center and size the SVGs in a manner appropriate to their use as icons, without me
  // having to learn how to edit someone else's horrible programmatic SVG paths myself.
  clipboard: "-9 -5 111 100",
  checkmark: "-2 -2 28 28",
};

function makeSvg(which) {
  // Cute trick from https://stackoverflow.com/a/26348198 that allows us to programmatically inject
  // SVG that can both be styled with CSS (<object> does not allow that) and doesn't require inlining
  // it onto every page. Unfortunately, it is required to restate the viewBox to size it correctly,
  // since the #reference only fetches the referred-to value, not any of the rest of the SVG.
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add(which);
  svg.setAttribute("viewBox", SVGS[which]);

  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  svg.appendChild(use);
  use.setAttribute("href", `/assets/svg/${which}.svg#icon`);

  return svg;
}

for (const element of document.querySelectorAll("pre > code")) {
  const button = document.createElement("div");
  element.parentNode.appendChild(button);

  button.classList.add("copy-button");
  button.appendChild(makeSvg("clipboard"));
  button.appendChild(makeSvg("checkmark"));

  button.addEventListener("click", () => {
    navigator.clipboard.writeText(element.textContent);

    button.classList.add("copied");
    setTimeout(() => {
      button.classList.remove("copied");
    }, 2000);
  });
}
