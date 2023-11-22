if (["light", "dark"].includes(localStorage["theme"])) {
  document.body.dataset.theme = localStorage["theme"];
}

document.getElementById("theme-switcher-wrapper").style.display = null;

document.getElementById("theme-switcher").addEventListener("click", (e) => {
  if (document.body.dataset.theme === "auto") {
    document.body.dataset.theme = localStorage["theme"] = "light";
  } else if (document.body.dataset.theme === "light") {
    document.body.dataset.theme = localStorage["theme"] = "dark";
  } else {
    document.body.dataset.theme = localStorage["theme"] = "auto";
  }

  // Don't scroll to top.
  e.preventDefault();
});
