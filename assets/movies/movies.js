/** @type HTMLDivElement */
const list = document.querySelector("#the-list");
/** @type HTMLDivElement */
const sidebar = document.querySelector("#sidebar");

sidebar.style = null;

/** @type HTMLDivElement[] */
const entries = [...document.querySelectorAll(".entry")];
const posters = [...document.querySelectorAll("#sidebar a")];

// TODO: Can the minimap itself be scrolled to scroll the main view?

document.addEventListener("scroll", () => {
  // TODO: the uneven margins on the posters is probably messing something up.

  // TODO: All of this once, instead of on every scroll.
  const { height: listHeight, top: listTop } = list.getBoundingClientRect();
  const sidebarHeight = sidebar.getBoundingClientRect().height;
  const totalHeight = document.documentElement.clientHeight;

  // TODO: Handle resizes.
  // TODO: This works poorly with lazy-load since the images are not loaded when this script runs.
  const offset = entries[0].getBoundingClientRect().top;
  const entryOffsets = entries.map(
    (e) => e.getBoundingClientRect().top - offset
  );
  const entrySizes = entries.map((e) => e.getBoundingClientRect().height);

  const posterOffset = posters[0].getBoundingClientRect().top;
  const entryPosterOffsets = posters.map(
    (e) => e.getBoundingClientRect().top - posterOffset
  );
  const posterSizes = posters.map((e) => e.getBoundingClientRect().height);

  const middle = listTop - totalHeight / 2;
  // TODO: binary search.
  const index = entryOffsets.findLastIndex((o) => o < -middle);
  const posterPct = -(entryOffsets[index] + middle) / entrySizes[index];
  // console.log(index, entryOffsets[index], middle, entrySizes[index], posterPct);
  sidebar.style.transform = `translateY(-${
    entryPosterOffsets[index] + posterPct * posterSizes[index]
  }px)`;

  // TODO: margins. posterPct can go over 1. when rolling over to the next movie, the
  // sidebar scroll skips slightly.

  // TODO: visual highlights for the movie in the middle, perhaps?

  // TODO: mobile styling. disappear when not being interacted with.

  // TODO: throttling, or something, obviously.
});
