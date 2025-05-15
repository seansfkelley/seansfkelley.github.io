---
layout: post
title: Is It Greek to Me?
custom-js-list:
  - /assets/is-it-greek-to-me/is-it-greek-to-me.js
custom-css-list:
  - /assets/is-it-greek-to-me/is-it-greek-to-me.css
---

I learned recently that there are more than a couple Greek mythological figures whose names are, verbatim, English words. I thought it would be fun to list them in quiz form, so here you go.

<hr>

{% include alert.html
kind="danger"
id="no-javascript-alert"
title="JavaScript Required"
content="This page is interactive, and only works with JavaScript enabled!"
%}

<div class="hidden" id="interactive">
  {% include alert.html
  kind="success"
  classes="hidden"
  id="right-answer"
  title="Right!"
  %}
  {% include alert.html
  kind="danger"
  classes="hidden"
  id="wrong-answer"
  title="Wrong!"
  %}
  {% for entry in site.data.greek %}
    <div class="question hidden">
      <div class="header">
        <h2 class="word">{{ entry.word }}</h2>
        <span class="pronunciation">/{{ entry.pronunciation }}/</span>
      </div>
      <div class="definition" >
        {{ entry.definition | markdownify }}
      </div>
      <p class="disclaimer">(this is only the first non-mythological definition, for brevity)</p>
      <p class="detail hidden" markdown="1">
        {{ entry.detail }}
      </p>
      <div class="buttons">
        <button data-is-answer="{{ entry.answer | negate | append: "" }}">📝 just a word</button>
        <button data-is-answer="{{ entry.answer | append: "" }}">⚡️ mythological figure</button>
      </div>
    </div>
  {%- endfor -%}
  <div id="end-message" class="hidden">
    <p>All done!</p>
    <p>You can refresh the page to try with a different random selection.</p>
  </div>
  <p id="score-container" class="hidden">
    <strong>Score</strong>: <span id="score"></span>
  </p>
</div>

{% include next-previous.html %}
