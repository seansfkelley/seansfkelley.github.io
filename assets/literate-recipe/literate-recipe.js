(function () {
  // Note that this has to be const, otherwise scope capture won't work properly in onClick.
  for (const step of document.querySelectorAll("section.recipe-step")) {
    const stepNumber = +step.dataset.stepNumber;
    const nextStep = document.querySelector(`section.recipe-step[data-step-number="${stepNumber + 1}"]`);
    if (nextStep) {
      nextStep.classList.add("current");
    }
  }
})();
