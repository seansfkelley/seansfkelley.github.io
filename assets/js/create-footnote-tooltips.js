(function (){
  const endnotes = {};
  for (n of document.querySelectorAll("[role=doc-endnote]")) {
    const match = /^fn:(\d+)$/.exec(n.id);
    if (match != null) {
      endnotes[match[1]] = n;
    }
  }

  for (sup of document.querySelectorAll("sup")) {
    const match = /^fnref:(\d+)$/.exec(sup.id);
    if (!match) {
      continue;
    }

    const endnote = endnotes[match[1]];
    if (!endnote) {
      continue;
    }

    const tooltip = document.createElement("div");
    tooltip.classList.add("footnote-preview");

    let content = endnote.cloneNode(true);
    content = content.querySelector("p");
    content?.querySelector(".reversefootnote")?.remove();

    const arrow = document.createElement("div");
    arrow.classList.add("arrow");
    arrow.setAttribute("data-popper-arrow", "");

    tooltip.appendChild(content);
    tooltip.appendChild(arrow);
    document.body.appendChild(tooltip);

    const instance = Popper.createPopper(sup, tooltip, {
      placement: "right",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8],
          },
        },
      ],
    });

    const timeout = {};

    sup.addEventListener("mouseenter", () => {
      timeout.t = setTimeout(() => {
        tooltip.setAttribute("data-show", "");
        instance.update();
      }, 500);
    });

    sup.addEventListener("mouseleave", () => {
      tooltip.removeAttribute("data-show");
      clearTimeout(timeout.t);
    });
  }
})();
