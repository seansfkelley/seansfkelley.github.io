---
layout: post
title: Blazon Parser and Renderer
custom-js-list:
  - /assets/blazon/grammar.js
  - /assets/blazon/blazon.js
custom-css-list:
  - /assets/blazon/blazon.css
---

Try these:

- <a class="example" href="#">Azure, a bend Or.</a>
- <a class="example" href="#">Party per pale gules and vert.</a>
- <a class="example" href="#">Or on a fess Gules between three rondels Azure a mullet Argent.</a>

<form id="form">
  <input type="text" id="blazon-input" value="Argent, a cross Gules.">

  <button type="submit">
  Preview
  </button>
</form>

<pre id="error"></pre>

<svg
  id="rendered"
  width="200"
  height="240"
  viewBox="-60 -70 120 140"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
</svg>

References:

- https://en.wikipedia.org/wiki/Blazon
- http://heraldry.sca.org/armory/bruce.html
- https://penelope.uchicago.edu/~grout/encyclopaedia_romana/britannia/anglo-saxon/flowers/heraldry.html
- https://drawshield.net/index.html
