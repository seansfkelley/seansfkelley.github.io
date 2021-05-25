(function () {
  const steps = [...document.querySelectorAll(".recipe-step")];
  const fixmeScannedWaits = [];

  steps.forEach((step, index) => {
    step.addEventListener("click", () => {
      recalculateOffsetsFrom(index);
    });

    fixmeScannedWaits.push(
      (fixmeScannedWaits[fixmeScannedWaits.length - 1] ?? 0) +
        +step.dataset.wait
    );
  });

  function recalculateOffsetsFrom(stepIndex) {
    // TODO:
    // - show both "in x minutes" and "at x time" (relative to now) text
    // - figure out which element should be interactive
    // - make it obvious it's interactive
    // - make the code less bad

    const offset = fixmeScannedWaits[stepIndex];
    const offsets = fixmeScannedWaits.map(w => w - offset);
    steps.forEach((step, i) => {
      step.querySelector('.elapsed').textContent = formatMinutes(offsets[i]);
    })
  }

  function formatMinutes(minutesInput) {
    const isNegative = minutesInput < 0;
    minutesInput = Math.abs(minutesInput);
    const hours = Math.floor(minutesInput / 60);
    const minutes = minutesInput % 60;

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes.toString();
    return `${isNegative ? '' : 'in '}${hours}:${formattedMinutes}${isNegative ? ' ago' : ''}`;
  }
})();
