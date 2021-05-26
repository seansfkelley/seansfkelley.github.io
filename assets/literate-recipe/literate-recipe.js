(function () {
  class Duration {
    constructor(minutes) {
      this.minutes = minutes;
    }

    static fromDate(date, roundUpTo = 1) {
      const minutes = date.getHours() * 60 + date.getMinutes();
      return new Duration(Math.ceil(minutes / roundUpTo) * roundUpTo);
    }

    static fromTimeInputValue(string) {
      const [hours, minutes] = string.split(":");
      return new Duration(+hours * 60 + +minutes);
    }

    static _toHoursAndMinutes(minutes) {
      return [Math.floor(minutes / 60), minutes % 60];
    }

    toTimeInputValue() {
      const [hours, minutes] = Duration._toHoursAndMinutes(
        (this.minutes < 0 ? this.minutes + 24 * 60 : this.minutes) % (24 * 60)
      );
      return `${hours < 10 ? "0" : ""}${hours}:${
        minutes < 10 ? "0" : ""
      }${minutes}`;
    }
  }

  const steps = [];

  function recalculateOffsetsRelativeTo(stepIndex, inputValue) {
    const selectedTime = Duration.fromTimeInputValue(inputValue);
    steps.forEach(({ offset, inlineTimeInput, scheduleTimeInput }) => {
      const value = new Duration(
        selectedTime.minutes + offset - steps[stepIndex].offset
      ).toTimeInputValue();
      inlineTimeInput.value = value;
      scheduleTimeInput.value = value;
    });
  }

  const scheduleSection = document.createElement("section");
  scheduleSection.classList.add("schedule");
  const scheduleHeader = document.createElement("h3");
  scheduleHeader.appendChild(document.createElement("hr"));
  scheduleHeader.appendChild(document.createTextNode("Overview"));
  scheduleHeader.appendChild(document.createElement("hr"));
  scheduleSection.appendChild(scheduleHeader);
  const scheduleList = document.createElement("ul");
  scheduleSection.appendChild(scheduleList);

  const nowDuration = Duration.fromDate(new Date(), 5);

  document.querySelectorAll(".recipe-step").forEach((step, index) => {
    const offset = (steps[steps.length - 1]?.offset ?? 0) + +step.dataset.wait;

    const inlineTimeInput = document.createElement("input");
    inlineTimeInput.type = "time";
    inlineTimeInput.step = "300";
    inlineTimeInput.value = nowDuration.toTimeInputValue();

    const scheduleTimeInput = inlineTimeInput.cloneNode();

    inlineTimeInput.addEventListener("change", () => {
      recalculateOffsetsRelativeTo(index, inlineTimeInput.value);
    });
    scheduleTimeInput.addEventListener("change", () => {
      recalculateOffsetsRelativeTo(index, scheduleTimeInput.value);
    });

    const setToNowButton = document.createElement("input");
    setToNowButton.type = "button";
    setToNowButton.value = "set to now";
    setToNowButton.addEventListener("click", () => {
      inlineTimeInput.value = Duration.fromDate(
        new Date(),
        5
      ).toTimeInputValue();
      recalculateOffsetsRelativeTo(index, inlineTimeInput.value);
    });

    step.querySelector(".metadata").appendChild(setToNowButton);
    step.querySelector(".metadata").appendChild(inlineTimeInput);

    const scheduleLine = document.createElement("li");
    scheduleLine.appendChild(scheduleTimeInput);
    scheduleLine.appendChild(document.createTextNode(step.dataset.shortname));
    scheduleList.appendChild(scheduleLine);

    steps.push({
      offset,
      inlineTimeInput,
      scheduleTimeInput,
    });
  });

  const firstStep = document.querySelector(".recipe-step");
  firstStep.parentNode.insertBefore(scheduleSection, firstStep);

  recalculateOffsetsRelativeTo(
    0,
    firstStep.querySelector('input[type="time"]').value
  );
})();
