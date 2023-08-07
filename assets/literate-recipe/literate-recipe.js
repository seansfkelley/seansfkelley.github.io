"use strict";
class Duration {
    minutes;
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
        const [hours, minutes] = Duration._toHoursAndMinutes((this.minutes < 0 ? this.minutes + 24 * 60 : this.minutes) % (24 * 60));
        return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}`;
    }
}
const groupedOrderedSteps = [];
function recalculateOffsetsRelativeTo(groupIndex, stepIndex) {
    const group = groupedOrderedSteps[groupIndex];
    const selectedTime = Duration.fromTimeInputValue(group[stepIndex].timeInput.value);
    group.forEach(({ offset, timeInput }) => {
        timeInput.value = new Duration(selectedTime.minutes + offset - group[stepIndex].offset).toTimeInputValue();
    });
}
const nowDuration = Duration.fromDate(new Date(), 5);
document.querySelectorAll(".recipe-step").forEach((step) => {
    const group = +step.dataset.stepGroup;
    const index = +step.dataset.stepIndex;
    const wait = step.dataset.wait === "overnight" ? 0 : +step.dataset.wait;
    const offset = (groupedOrderedSteps[group]?.at(-1)?.offset ?? 0) + wait;
    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.step = "300";
    timeInput.value = nowDuration.toTimeInputValue();
    timeInput.addEventListener("change", (e) => {
        recalculateOffsetsRelativeTo(group, index);
    });
    const setToNowButton = document.createElement("input");
    setToNowButton.type = "button";
    setToNowButton.value = "set to now";
    setToNowButton.addEventListener("click", () => {
        timeInput.value = Duration.fromDate(new Date(), 5).toTimeInputValue();
        recalculateOffsetsRelativeTo(group, index);
    });
    step.querySelector(".metadata").appendChild(setToNowButton);
    step.querySelector(".metadata").appendChild(timeInput);
    (groupedOrderedSteps[group] ??= []).push({
        offset,
        timeInput,
    });
});
groupedOrderedSteps.forEach((_, index) => {
    recalculateOffsetsRelativeTo(index, 0);
});
//# sourceMappingURL=literate-recipe.js.map