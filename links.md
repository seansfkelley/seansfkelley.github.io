---
layout: base
---

<ul class="link-list">
  {%- for entry in site.data.links -%}
    {%- assign id = entry.title | slugify: "latin" -%}
    <li href="#{{ id }}">
      <div class="title-container">
        <h3>
          <a href="{{ entry.url }}">{{ entry.title }}</a>
        </h3>
        <span class="date">
          {{ entry.publish_date | date: site.date_format }}
        </span>
        {%- if entry.archive -%}<span>[<a class="archive" href="{{ entry.archive }}">archive</a>]</span>{%- endif -%}
      </div>
      <blockquote class="excerpt" markdown="1">{{ entry.excerpt }}</blockquote>
    </li>
  {%- endfor -%}
</ul>
