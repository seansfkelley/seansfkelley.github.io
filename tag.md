---
layout: base
---

<article class="tag-page">
  <h2>Tags:</h2>

  {%- comment -%}
  Adapted from https://lei1025.github.io/Implement-Sorting-Tags-by-Name-and-Value-in-Jekyll/

  Liquid is such trash.
  {%- endcomment -%}

  {% capture site_tags %}
    {%- for tag in site.tags -%}
      {{ tag | first }}{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  {% endcapture %}
  {%- assign sorted_tags = site_tags | split:',' | sort_natural -%}

  <ul>
    {%- for t in sorted_tags -%}
    <li>
      <a href="/tag/{{ t }}">{{ t }}</a>
    </li>
    {%- endfor -%}
  </ul>
</article>
