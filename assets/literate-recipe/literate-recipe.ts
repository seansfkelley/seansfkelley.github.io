class Duration {
  constructor(public readonly minutes: number) {}

  static fromDate(date: Date, roundUpTo: number = 1) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return new Duration(Math.ceil(minutes / roundUpTo) * roundUpTo);
  }

  static fromTimeInputValue(string: string) {
    const [hours, minutes] = string.split(":");
    return new Duration(+hours * 60 + +minutes);
  }

  static _toHoursAndMinutes(minutes: number) {
    return [Math.floor(minutes / 60), minutes % 60];
  }

  public plus(minutes: number): Duration {
    return new Duration(this.minutes + minutes);
  }

  public toTimeInputValue() {
    const [hours, minutes] = Duration._toHoursAndMinutes(
      (this.minutes < 0 ? this.minutes + 24 * 60 : this.minutes) % (24 * 60)
    );
    return `${hours < 10 ? "0" : ""}${hours}:${
      minutes < 10 ? "0" : ""
    }${minutes}`;
  }
}

const groupedOrderedSteps: {
  offset: number;
  duration: number;
  startTimeInput: HTMLInputElement;
  endTimeInput: HTMLInputElement;
}[][] = [];

function recalculateOffsetsRelativeTo(
  groupIndex: number,
  stepIndex: number,
  which: "start" | "end"
) {
  const group = groupedOrderedSteps[groupIndex];
  const step = group[stepIndex];

  const startTime =
    which === "start"
      ? Duration.fromTimeInputValue(step.startTimeInput.value)
      : Duration.fromTimeInputValue(step.endTimeInput.value).plus(
          -step.duration
        );

  group.forEach(({ offset, duration, startTimeInput, endTimeInput }) => {
    const start = new Duration(startTime.minutes + offset - step.offset);
    startTimeInput.value = start.toTimeInputValue();
    const end = start.plus(duration);
    endTimeInput.value = end.toTimeInputValue();
  });
}

const nowDuration = Duration.fromDate(new Date(), 5);

document.querySelectorAll<HTMLElement>(".recipe-step").forEach((step) => {
  const group: number = +step.dataset.stepGroup!;
  const index: number = +step.dataset.stepIndex!;
  const wait: number =
    step.dataset.wait === "overnight" ? 0 : +step.dataset.wait!;
  const duration: number = +step.dataset.duration!;
  const offset = (groupedOrderedSteps[group]?.at(-1)?.offset ?? 0) + wait;

  const startTimeInput = document.createElement("input");
  startTimeInput.type = "time";
  startTimeInput.step = "300";
  startTimeInput.value = nowDuration.toTimeInputValue();
  startTimeInput.addEventListener("change", (e) => {
    recalculateOffsetsRelativeTo(group, index, "start");
  });

  const endTimeInput = document.createElement("input");
  endTimeInput.type = "time";
  endTimeInput.step = "300";
  endTimeInput.value = nowDuration.toTimeInputValue();
  endTimeInput.addEventListener("change", (e) => {
    recalculateOffsetsRelativeTo(group, index, "end");
  });

  const setToNowButton = document.createElement("input");
  setToNowButton.type = "button";
  setToNowButton.value = "set to now";
  setToNowButton.addEventListener("click", () => {
    startTimeInput.value = Duration.fromDate(new Date(), 5).toTimeInputValue();
    recalculateOffsetsRelativeTo(group, index, "start");
  });

  step
    .querySelector(".metadata")!
    .append(setToNowButton, startTimeInput, " → ", endTimeInput);

  (groupedOrderedSteps[group] ??= []).push({
    offset,
    duration,
    startTimeInput,
    endTimeInput,
  });
});

groupedOrderedSteps.forEach((_, index) => {
  recalculateOffsetsRelativeTo(index, 0, "start");
});
