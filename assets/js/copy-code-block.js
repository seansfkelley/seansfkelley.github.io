for (const element of document.querySelectorAll("pre > code")) {
  const button = document.createElement("span");
  button.classList.add("copy-button");

  button.addEventListener("click", () => {
    navigator.clipboard.writeText(element.textContent);
  });

  element.parentNode.appendChild(button);
}
