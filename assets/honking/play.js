const audios = [...document.getElementsByTagName("audio")];

let playing = false;
function listener() {
  if (playing) {
    return;
  }

  function onEnded() {
    playing = false;
    which.removeEventListener("ended", onEnded);
  }

  const which = audios[Math.floor(Math.random() * audios.length)];
  which.addEventListener("ended", onEnded);
  which.play();
  playing = true;
}
document.addEventListener("mousedown", listener);
document.addEventListener("keydown", listener);
document.addEventListener("touchstart", listener);
