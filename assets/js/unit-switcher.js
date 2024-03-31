if (["imperial", "metric"].includes(localStorage["unit"])) {
  document.body.dataset.unit = localStorage["unit"];
}

const unitSwitcherWrapper = document.getElementById("unit-switcher-wrapper");
if (unitSwitcherWrapper != null) {
  unitSwitcherWrapper.style.display = null;

  document
    .getElementById("unit-switcher-imperial")
    .addEventListener("click", (e) => {
      document.body.dataset.unit = localStorage["unit"] = "imperial";

      // Don't scroll to top.
      e.preventDefault();
    });

  document
    .getElementById("unit-switcher-metric")
    .addEventListener("click", (e) => {
      document.body.dataset.unit = localStorage["unit"] = "metric";

      // Don't scroll to top.
      e.preventDefault();
    });
}
