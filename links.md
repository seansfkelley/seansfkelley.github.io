---
layout: base
---

<ul class="link-list">
  {%- for entry in site.data.links -%}
    {%- assign id = entry.title | slugify: "latin" -%}
    <li href="#{{ id }}">
      <div class="title-container">
        <h2>
          <a href="{{ entry.url }}">{{ entry.title }}</a>
        </h2>
        <span class="metadata">
          <span class="date">
            {{ entry.publish_date | date: site.date_format }}
          </span>
          {%- if entry.archive -%}[<a class="archive" href="{{ entry.archive }}">archive</a>]{%- endif -%}
        </span>
      </div>
      <blockquote class="excerpt" markdown="1">{{ entry.excerpt }}</blockquote>
    </li>
  {%- endfor -%}
</ul>
