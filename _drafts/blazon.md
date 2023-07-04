---
layout: post
title: Blazon Parser and Renderer
custom-js-list:
  - /assets/blazon/grammar.js
  - /assets/blazon/blazon.js
custom-css-list:
  - /assets/blazon/blazon.css
---

<textarea id="blazon-input">
Azure, a bend Or.
</textarea>

<button id="refresh">
Refresh
</button>

<pre id="error"></pre>

<svg
  width="200"
  height="240"
  viewBox="-60 -70 140 120"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Embed a <g> because it isolates viewBox wierdness when doing clipPaths. -->
  <g id="rendered"></g>
</svg>
