/**
 * @typedef {"tv" | "movie" | "both"} Kind
 * @typedef {"recommended" | "not-recommended" | "both"} Recommendation
 * @typedef {"watched-asc" | "watched-desc" | "year-asc" | "year-desc" | "title-asc" | "title-desc"} Sort
 */

/** @type HTMLFormElement */
const form = document.querySelector("#sort-filter");
/** @type HTMLElement */
const list = document.querySelector(".list-container");
/** @type HTMLElement[] */
const entries = [...document.querySelectorAll(".entry")];

function updateSortAndFilter() {
  /** @type Kind */
  const kind = form.elements.kind.value;
  /** @type Recommendation */
  const recommendation = form.elements.recommendation.value;

  /**
   * @param {HTMLElement} element
   */
  function matches(element) {
    return (
      (kind === "both" || element.dataset.kind === kind) &&
      (recommendation === "both" ||
        element.dataset.recommendation === recommendation)
    );
  }

  /** @type Sort */
  const sort = form.elements.sort.value;
  /** @type ["watched" | "year" | "title", "asc" | "desc"] */
  const [field, direction] = sort.split("-");

  /**
   * @param {HTMLElement} first
   * @param {HTMLElement} second
   */
  function comparator(first, second) {
    function getNormalizedField(element) {
      return element.dataset[field].toLowerCase().replace(/the /, "");
    }

    const ordering =
      getNormalizedField(first).localeCompare(getNormalizedField(second)) *
      (direction === "desc" ? -1 : 1);

    if (ordering === 0) {
      // Don't respect direction during the tie break -- always want older ones first.
      return -first.dataset.title
        .toLowerCase()
        .localeCompare(second.dataset.title.toLowerCase());
    } else {
      return ordering;
    }
  }

  entries.sort(comparator);

  for (const e of entries) {
    e.classList.toggle("hidden", !matches(e));
    // Will move the item from its original position, thereby reordering the entire list.
    list.appendChild(e);
  }
}

form.style = null;
updateSortAndFilter();

form.addEventListener("change", updateSortAndFilter);
