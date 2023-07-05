---
layout: post
title: Blazonry
custom-js-list:
  - /assets/blazonry/grammar.js
  - /assets/blazonry/blazonry.js
custom-css-list:
  - /assets/blazonry/blazonry.css
---

[Wikipedia](https://en.wikipedia.org/wiki/Blazon):

> In heraldry and heraldic vexillology, a blazon is a formal description of a coat of arms, flag or similar emblem, from which the reader can reconstruct the appropriate image.

Blazons (and the coats of arms they represent) can get enormously complicated.

[provide example]

Blazonry jargon is highly structured, which makes it a good match for the same sorts of parsers used to implement programming languages. So I took one of those and taught it to parse and render blazons. Check out [the formal grammar](/assets/blazonry/grammar.txt).

Try these:

<!-- TODO: Use more famous ones! -->

- <a class="example" href="#">Azure, a bend Or.</a>
- <a class="example" href="#">Party per pale gules and vert.</a>
- <a class="example" href="#">Argent, a cross Gules.</a>
- <a class="example" href="#">Argent on a chevron Gules between three leopard's faces Sable three castles Or.</a>

<div class="center">
  <form id="form">
    <input type="text" id="blazon-input" value="party per pale argent and vert three mullets counterchanged in fess">
    <br>
    <button type="submit">
    Preview
    </button>
  </form>

  <pre id="error"></pre>

  <svg
    id="rendered"
    width="200"
    height="240"
    viewBox="-52 -62 104 124"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  ></svg>
</div>

References:

- [Armorials – Twenty Trees](https://www.twentytrees.co.uk/Guest/General/Thing/Heraldry.html?Armorials) (an enourmous list of blazons and their renderings; requires clicking through pages)
- [A Grammar of Balzonry – Society for Creative Anachronism](http://heraldry.sca.org/armory/bruce.html)
- [Heraldry and Blazon – U. Chicago](https://penelope.uchicago.edu/~grout/encyclopaedia_romana/britannia/anglo-saxon/flowers/heraldry.html)
- [DrawShield](https://drawshield.net/index.html) (yeah, turns out someone already did this, but it was fun anyway)

-------------------------------------------------------------------------------

{% include next-previous.html %}
