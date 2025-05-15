document.querySelector("#interactive").classList.remove("hidden");
document.querySelector("#no-javascript-alert").remove();

function fisherYates(input) {
  const shuffled = [...input];
  for (let i = shuffled.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const rightAnswer = document.querySelector("#right-answer");
const wrongAnswer = document.querySelector("#wrong-answer");
const scoreContainer = document.querySelector("#score-container");
const scoreDisplay = document.querySelector("#score");
const endMessage = document.querySelector("#end-message");

const questions = document.querySelectorAll(".question");
const shuffledQuestions = fisherYates(questions).slice(0, 10);

let score = 0;
let questionsAsked = 1;

function createOnAnswer(isCorrect, current, next) {
  const [toShow, toHide] = isCorrect ? [rightAnswer, wrongAnswer] : [wrongAnswer, rightAnswer];

  return () => {
    if (isCorrect) {
      score++;
    }

    scoreContainer.classList.remove("hidden");
    scoreDisplay.textContent = `${score} / ${questionsAsked}`;

    toHide.classList.add("hidden");

    toShow.classList.remove("hidden");
    toShow.querySelector(".detail")?.remove();

    const detail = current.querySelector(".detail");
    toShow.appendChild(detail);
    detail.classList.remove("hidden");

    current.classList.add("hidden");

    if (next != null) {
      questionsAsked++;
      next.classList.remove("hidden");
    } else {
      endMessage.classList.remove("hidden");
    }
  };
}

for (let i = 0; i < shuffledQuestions.length; ++i) {
  const current = shuffledQuestions[i];
  const next = shuffledQuestions[i + 1];

  current
    .querySelector('button[data-is-answer="true"]')
    .addEventListener("click", createOnAnswer(true, current, next));
  current
    .querySelector('button[data-is-answer="false"]')
    .addEventListener("click", createOnAnswer(false, current, next));
}

shuffledQuestions[0].classList.remove("hidden");
