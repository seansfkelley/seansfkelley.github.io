const input = document.querySelector("#blazon-input");
const refresh = document.querySelector("#refresh");
const rendered = document.querySelector("#rendered");
const error = document.querySelector("#error");

refresh.addEventListener("click", () => {
  parseAndRenderBlazon(input.value, rendered);
});

function parseAndRenderBlazon(text, rendered) {
  try {
    console.log(parser.parse(text.trim()));
    error.style.display = "none";
  } catch (e) {
    error.innerHTML = e.toString();
    error.style.display = "block";
    console.error("start", e.location.start);
    console.error("end", e.location.end);
    console.error("expected", e.expected);
  }
}

parseAndRenderBlazon(input.value);
