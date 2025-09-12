/**
 * @typedef {"tv" | "movie" | "both"} Kind
 * @typedef {"recommended" | "not-recommended" | "both"} Recommendation
 * @typedef {"watched-asc" | "watched-desc" | "year-asc" | "year-desc" | "title-asc" | "title-desc"} Sort
 * @typedef {{ kind: Kind; recommendation: Recommendation; sort: Sort; }} Filters
 */

function compactObject(obj) {
  const newObj = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v != null) {
      newObj[k] = v;
    }
  }
  return newObj;
}

const TITLE_IGNORE_REGEX = /^the /i;

/** @type HTMLFormElement */
const form = document.querySelector("#sort-filter");
/** @type HTMLElement */
const list = document.querySelector(".list-container");
/** @type HTMLElement[] */
const entries = [...document.querySelectorAll(".entry")];
/** @type HTMLElement */
const summary = document.querySelector("#sort-filter-summary");

list.classList.remove("reveal-spoilers-on-hover");

for (const e of document.querySelectorAll(".spoiler")) {
  const button = document.createElement("button");
  button.classList.add("reveal-button");
  button.textContent = "Reveal Spoiler";
  e.appendChild(button);

  button.addEventListener("click", (event) => {
    e.classList.add("revealed");
    e.removeChild(button);
    // In case the button is inside an <a>.
    event.preventDefault();
  });
}
/** @type Filters */
const defaultFilters = {
  kind: form.elements.kind.value,
  recommendation: form.elements.recommendation.value,
  sort: form.elements.sort.value,
};
/** @type (keyof Filters)[] */
const FILTER_KEYS = Object.keys(defaultFilters);

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
      (recommendation === "both" || element.dataset.recommendation === recommendation)
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
      return element.dataset[field].toLowerCase().replace(TITLE_IGNORE_REGEX, "");
    }

    const ordering =
      getNormalizedField(first).localeCompare(getNormalizedField(second)) *
      (direction === "desc" ? -1 : 1);

    if (ordering === 0) {
      // Don't respect direction during the tie break -- always want to be sorted descending.
      return first.dataset.title
        .toLowerCase()
        .replace(TITLE_IGNORE_REGEX, "")
        .localeCompare(second.dataset.title.toLowerCase().replace(TITLE_IGNORE_REGEX, ""));
    } else {
      return ordering;
    }
  }

  entries.sort(comparator);

  let movieCount = 0;
  let tvCount = 0;
  for (const e of entries) {
    if (matches(e)) {
      e.classList.remove("hidden");

      if (e.dataset.kind === "movie") {
        movieCount++;
      } else if (e.dataset.kind === "tv") {
        tvCount++;
      } else {
        throw new Error(`unrecognized type: ${e.dataset.kind}`);
      }
    } else {
      e.classList.add("hidden");
    }

    // Will move the item from its original position, thereby reordering the entire list.
    list.appendChild(e);
  }

  if (movieCount > 0 || tvCount > 0) {
    summary.textContent =
      "showing " +
      [
        movieCount > 0 ? `${movieCount} movies` : undefined,
        tvCount > 0 ? `${tvCount} TV shows` : undefined,
      ]
        .filter((v) => v != null)
        .join(" and ");
  } else {
    summary.textContent = `no matches`;
  }

  localStorage["movie-sort-filter"] = JSON.stringify({
    kind,
    recommendation,
    sort,
    timestamp: new Date().toISOString(),
  });

  const params = compactObject({
    kind: kind === defaultFilters.kind ? undefined : kind,
    recommendation: recommendation === defaultFilters.recommendation ? undefined : recommendation,
    sort: sort === defaultFilters.sort ? undefined : sort,
  });
  if (Object.entries(params).length > 0) {
    window.history.replaceState(null, "", "?" + new URLSearchParams(params) + window.location.hash);
  } else {
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }
}

try {
  const params = new URLSearchParams(window.location.search);
  if (FILTER_KEYS.some((k) => params.has(k))) {
    console.log("setting filters from URL", params);
    for (const k of FILTER_KEYS) {
      form.elements[k].value = params.get(k) || defaultFilters[k];
    }
  } else {
    const storedFilters = JSON.parse(localStorage["movie-sort-filter"] || "{}");

    if (
      typeof storedFilters.timestamp === "string" &&
      // If this fails to parse, it will yield NaN which will propagate and fail the conditional, so
      // we'll end up with only defaults, which is fine.
      new Date() - new Date(storedFilters.timestamp) < 24 * 60 * 60 * 1000 &&
      FILTER_KEYS.every((k) => typeof storedFilters[k] === "string")
    ) {
      console.log("setting filters from localStorage", storedFilters);
      for (const k of FILTER_KEYS) {
        form.elements[k].value = storedFilters[k];
      }
    }
  }
} catch (e) {
  console.error("not setting default sort/filter values due to error", e);
}

form.style = null;
updateSortAndFilter();

form.addEventListener("change", updateSortAndFilter);
