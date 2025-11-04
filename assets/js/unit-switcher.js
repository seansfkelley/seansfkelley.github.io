const UNIT_KEY = "unit";

if (["imperial", "metric"].includes(localStorage[UNIT_KEY])) {
  document.body.dataset.unit = localStorage[UNIT_KEY];
}

const unitSwitcherWrapper = document.getElementById("unit-switcher-wrapper");
if (unitSwitcherWrapper != null) {
  unitSwitcherWrapper.style.display = null;

  document.getElementById("unit-switcher-imperial").addEventListener("click", (e) => {
    document.body.dataset.unit = localStorage[UNIT_KEY] = "imperial";

    // Don't scroll to top.
    e.preventDefault();
  });

  document.getElementById("unit-switcher-metric").addEventListener("click", (e) => {
    document.body.dataset.unit = localStorage[UNIT_KEY] = "metric";

    // Don't scroll to top.
    e.preventDefault();
  });
}

window.addEventListener("storage", (e) => {
  if (e.key === UNIT_KEY) {
    document.body.dataset.unit = e.newValue;
  }
});
