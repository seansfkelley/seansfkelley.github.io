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

> In heraldry and heraldic vexillology, a **blazon** is a formal description of a coat of arms, flag or similar emblem, from which the reader can reconstruct the appropriate image.

Blazons (and the coats of arms they represent) can get [enormously complicated](https://en.wikipedia.org/wiki/Richard_Temple-Nugent-Brydges-Chandos-Grenville,_2nd_Duke_of_Buckingham_and_Chandos#/media/File:Stowe_Armorial.jpg).

Blazonry jargon is highly structured, which makes it a good match for the same sorts of parsers used to implement programming languages. So I took one of those and taught it to parse and render blazons.

Blazons have many composable components, from <a href="#" data-example="Gules.">simple colors</a> ("field") and <a href="#" data-example="Argent, a fess Sable.">geometric shapes</a> ("ordinary"), through iconography both <a href="#" data-example="Argent, six mullets Sable.">simple</a> and <a href="#" data-example="Sable, a lion rampant Gules armed and langued Or.">complex</a> ("charge"), into <a href="#" data-example="Barry bendy of eight Azure and Argent.">patterned backgrounds</a> ("varied") and <a href="#" data-example="Party per pale Argent and Gules, three rondels counterchanged.">subdivisions</a> ("party").

Try these:

<!-- TODO: Use more famous ones! -->

- <a href="#" data-example>Azure, a bend Or.</a> – [_Scrope v. Grosvenor_](https://en.wikipedia.org/wiki/Scrope_v_Grosvenor)
- <a href="#" data-example>Argent, a cross Gules.</a> – [Cross of St. George](https://en.wikipedia.org/wiki/Flag_of_England)
- <a href="#" data-example>Argent on a chevron Gules between three leopard's faces Sable three castles Or.</a>

You can mix and match these examples, of course, or copy-paste blazons from the Wikipedia page or other pages linked below. There is a very long tail of unusual ordinaries, charges, varieds, etc., so not everything you may find is supported. You can always poke around [the formal grammar](/assets/blazonry/grammar.txt) to see what's defined or not.

<div class="center">
  <form id="form">
  <!-- argent a bend gules cotised azure -->
  <!-- party per pale argent and gules a bend azure cotised counterchanged -->
    <input type="text" id="blazon-input" value="party per saltire indented argent and gules">
    <br>
    <button type="submit">
    Preview
    </button>
  </form>

  <pre id="error"></pre>

  <svg
    id="rendered"
    width="300"
    height="360"
    viewBox="-52 -62 104 124"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  ></svg>

  <details id="ast-wrapper">
  <summary>View parsed syntax tree</summary>
  <pre id="ast"></pre>
  </details>
</div>

References:

- [Armorials – Twenty Trees](https://www.twentytrees.co.uk/Guest/General/Thing/Heraldry.html?Armorials) (an enourmous list of blazons and their renderings; requires clicking through pages)
- [A Grammar of Balzonry – Society for Creative Anachronism](http://heraldry.sca.org/armory/bruce.html)
- [Heraldry and Blazon – U. Chicago](https://penelope.uchicago.edu/~grout/encyclopaedia_romana/britannia/anglo-saxon/flowers/heraldry.html)
- [DrawShield](https://drawshield.net/index.html) (yeah, turns out someone already did this, but it was fun anyway)

-------------------------------------------------------------------------------

{% include next-previous.html %}
