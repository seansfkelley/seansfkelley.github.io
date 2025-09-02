---
layout: base
---

<article class="tag-page">
  <h2>Tags:</h2>

  <ul>
    {%- for pair in site.tags -%}
    <li>
      <a href="/tag/{{ pair | first }}">{{ pair | first }}</a>
    </li>
    {%- endfor -%}
  </ul>
</article>
