const audios = [...document.getElementsByTagName("audio")];
const mute = document.getElementById("mute");

/** @type HTMLAudioElement | undefined */
let playing = undefined;
let muted = false;

function maybeHonk() {
  if (muted || playing != null) {
    return;
  }

  function onEnded() {
    playing = undefined;
    which.removeEventListener("ended", onEnded);
  }

  const which = audios[Math.floor(Math.random() * audios.length)];
  which.addEventListener("ended", onEnded);
  which.play();
  playing = which;

  // Wait until the first interaction to show it.
  mute.style = null;
}

document.addEventListener("mousedown", maybeHonk);
document.addEventListener("keydown", maybeHonk);
document.addEventListener("touchstart", maybeHonk);

mute.addEventListener("click", () => {
  if (playing != null) {
    playing.pause();
    playing.currentTime = 0;
    playing = undefined;
  }

  muted = !muted;
  mute.classList.toggle("muted", muted);
  mute.innerHTML = muted ? "bring it on" : "shut the fuck up";

  if (!muted) {
    maybeHonk();
  }
});
