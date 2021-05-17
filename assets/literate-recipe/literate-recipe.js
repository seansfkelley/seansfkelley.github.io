(function () {
  // Note that this has to be const, otherwise scope capture won't work properly in onClick.
  for (const e of document.querySelectorAll("button[data-step-number]")) {
    e.style.display = null;
    e.textContent = "mark as done";
    e.addEventListener("click", () => {
      const stepNumber = +e.dataset.stepNumber;
      const stepHeader = document.getElementById(`step-header-${stepNumber}`);
      stepHeader.classList.add("complete");
      stepHeader.classList.remove("up-next");

      const nextStepHeader = document.getElementById(`step-header-${stepNumber + 1}`);
      if (nextStepHeader) {
        nextStepHeader.classList.add("up-next");
      }
    });
  }
})();
