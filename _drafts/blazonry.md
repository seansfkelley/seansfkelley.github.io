---
layout: post
title: Blazonry
custom-js-list:
  - /assets/blazonry/nearley.js
  - /assets/blazonry/randexp.min.js
  - /assets/blazonry/nearley-unparse.js
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
- <a href="#" data-example>Per pale Sable and Argent, a fess embattled counterchanged.</a> – Arms of [Muri bei Bern, Switzerland](https://en.wikipedia.org/wiki/Muri_bei_Bern)
- <a href="#" data-example>Azure, a bend Argent cotised Or between six lions rampant Or.</a> – [Bohun family arms](https://en.wikipedia.org/wiki/Bohun_family)
- <a href="#" data-example="Quarterly 1st and 4th Sable a lion rampant Argent on a canton Argent a cross Gules; 2nd and 3rd quarterly 1st and 4th Argent 2nd and 3rd Gules a fret Or overall on a bend Sable three escallops bendwise Argent. An inescutcheon in chief Argent a cross Gules an escutcheon Azure three fleurs-de-lis Or.">Quarterly 1st and 4th Sable a lion rampant on a canton Argent a cross Gules...</a>[^1] – [Arms of Winston Churchill](https://winstonchurchill.org/resources/reference/the-armorial-bearings-of-sir-winston-churchill/)
- <a href="#" data-example="Quarterly: (1) Sable, a lion rampant Or, armed and langued Gules; (2) per fess indented Gules and Argent; (3) Argent, a lion rampant Azure, armed Or and langued Gules; (4) Or, three lions passant Sable, armed and langued Gules in pale. An inescutcheon fusilly Argent and Azure.">Quarterly: (1) sable, a lion rampant Or, armed and langued gules...</a>[^2] – [Arms of Bavaria](https://en.wikipedia.org/wiki/Coat_of_arms_of_Bavaria), which you may have seen on [Weihenstephan beers](https://www.weihenstephaner.com/our-brewery)

You can mix and match these examples, of course, or copy-paste blazons from the Wikipedia page or other pages linked below. There is a very long tail of unusual ordinaries, charges, varieds, etc., so not everything you may find is supported. You can always poke around [the formal grammar](/assets/blazonry/grammar.txt) to see what's defined or not.

{% include alert.html
kind="danger"
id="no-javascript-alert"
title="JavaScript Required"
content="This page is interactive, and only works with JavaScript enabled!"
%}

<div class="center hidden" id="interactive">
  <form id="form">
    <input type="text" id="blazon-input" value="argent an escutcheon gules. an inescutcheon azure three mullets or">
    <div>
      <button id="random-blazon" type="button">
      Generate Hideous Random Blazon
      </button>
      <button type="submit">
      Preview
      </button>
    </div>
  </form>

  <div id="ambiguous" class="hidden">
    <span>Ambiguous blazon! Navigate variations:</span>
    <button id="ambiguous-previous">⇦</button>
    <span id="ambiguous-count"></span>
    <button id="ambiguous-next">⇨</button>
  </div>

  <pre id="error" class="hidden"></pre>

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

- [Armorials – Twenty Trees](https://www.twentytrees.co.uk/History/General/Thing/Heraldry.html?Armorials) (an enourmous list of blazons and their renderings; requires clicking through pages)
- [A Grammar of Balzonry – Society for Creative Anachronism](http://heraldry.sca.org/armory/bruce.html)
- [Heraldry and Blazon – U. Chicago](https://penelope.uchicago.edu/~grout/encyclopaedia_romana/britannia/anglo-saxon/flowers/heraldry.html)
- [Roll of Arms – U.S. Heraldic Registry](http://usheraldicregistry.com/index.php?n=Main.Contents)
- [Line (heraldry) – Wikipedia](https://en.wikipedia.org/wiki/Line_(heraldry))
- [DrawShield](https://drawshield.net/index.html) (yeah, turns out someone already did this, but it was fun anyway)

-------------------------------------------------------------------------------

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: Not _exactly_; some changes had to be made to the official blazoning because I don't support phrasings like "of the first" (dispreferred ["Victorianisms"](https://heraldry.sca.org/armory/bruce.html) ctrl-f "victorian"), the million different ways of specifying quarterings, or the underspecified "as anaugmentation" phrasing for inescutcheons.
[^2]: Like Churchill's arms, I had to tweak some of the phrasing. I also subbed the panther for a lion because I couldn't find a good panther graphic. Sorry!
