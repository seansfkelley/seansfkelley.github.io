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

    toTextString() {
      if (this.minutes === 0) {
        return "now";
      } else {
        const [hours, minutes] = Duration._toHoursAndMinutes(
          Math.abs(this.minutes)
        );
        const formatted = `${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
        return this.minutes < 0 ? `${formatted} ago` : `in ${formatted}`;
      }
    }

    asMinutes() {
      return this.minutes;
    }
  }

  const steps = [];

  function recalculateOffsetsRelativeTo(stepIndex) {
    const selectedTime = Duration.fromTimeInputValue(
      steps[stepIndex].timeInput.value
    );

    // TODO:
    // - show both "in x minutes" and "at x time" (relative to now) text
    // - figure out which element should be interactive
    // - make it obvious it's interactive
    steps.forEach(({ offset, timeDisplay, timeInput }) => {
      const deltaMinutes = offset - steps[stepIndex].offset;
      timeDisplay.textContent = new Duration(deltaMinutes).toTextString();
      timeInput.value = new Duration(
        selectedTime.minutes + deltaMinutes
      ).toTimeInputValue();
    });
  }

  const nowDuration = Duration.fromDate(new Date());

  document.querySelectorAll(".recipe-step").forEach((step, index) => {
    const offset = (steps[steps.length - 1]?.offset ?? 0) + +step.dataset.wait;

    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.step = "300";
    timeInput.value = nowDuration.toTimeInputValue();
    timeInput.addEventListener("change", (e) => {
      recalculateOffsetsRelativeTo(index);
    });

    step.querySelector(".metadata").appendChild(timeInput);

    steps.push({
      offset,
      timeDisplay: step.querySelector(".elapsed"),
      timeInput,
    });
  });

  recalculateOffsetsRelativeTo(0);
})();
