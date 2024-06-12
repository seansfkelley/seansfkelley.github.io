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
      // Don't respect direction during the tie break -- always want to be sorted descending.
      return first.dataset.title
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

  localStorage["movie-sort-filter"] = JSON.stringify({
    kind,
    recommendation,
    sort,
    timestamp: new Date().toISOString(),
  });
}

try {
  const { kind, recommendation, sort, timestamp } = JSON.parse(
    localStorage["movie-sort-filter"] || "{}"
  );

  if (
    typeof timestamp === "string" &&
    // If this fails to parse, it will yield NaN which will propagate and fail the conditional, so
    // we'll end up with only defaults, which is fine.
    new Date() - new Date(timestamp) < 24 * 60 * 60 * 1000 &&
    typeof kind === "string" &&
    typeof recommendation === "string" &&
    typeof sort === "string"
  ) {
    // If any of these are invalid, the browser will just default to what the DOM says to, so no
    // need to be too clever.
    form.elements.kind.value = kind;
    form.elements.recommendation.value = recommendation;
    form.elements.sort.value = sort;
  }
} catch (e) {
  console.error("not setting default sort/filter values due to error", e);
}

form.style = null;
updateSortAndFilter();

form.addEventListener("change", updateSortAndFilter);
