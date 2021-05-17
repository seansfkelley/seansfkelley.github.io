(function () {
  const checkboxContainer = document.getElementById("interactive-checkbox");
  checkboxContainer.style.display = null;

  const article = document.querySelector("article");
  const checkbox = checkboxContainer.querySelector("input");

  checkbox.addEventListener("change", (e) => {
    article.classList.toggle("interaction-enabled", e.target.checked);
  });

  // Since the checkbox has an ID, soft reloads of the page will keep it checked if it was before.
  if (checkbox.checked) {
    article.classList.add("interaction-enabled");
  }

  document.querySelector("section.recipe-step").classList.add("current");

  // Note that this has to be const, otherwise scope capture won't work properly in onClick.
  for (const step of document.querySelectorAll("section.recipe-step")) {
    const stepNumber = +step.dataset.stepNumber;
    step.querySelector("button.done-button").addEventListener("click", () => {
      step.classList.remove("current");
      step.classList.add("complete");

      const nextStep = document.querySelector(`section.recipe-step[data-step-number="${stepNumber + 1}"]`);
      if (nextStep) {
        nextStep.classList.add("current");
      }
    });
  }
})();
