---
layout: base
---

<ul class="link-list">
  {%- for entry in site.data.links -%}
    {%- assign id = entry.title | slugify: "latin" -%}
    <li href="#{{ id }}">
      <div class="title-container">
        <a class="title" href="{{ entry.url }}" markdown="1">{{ entry.title }}</a>
        <span class="metadata">
          <span class="date">
            {{ entry.publish_date | date: site.date_format }}
          </span>
          {%- if entry.archive -%}&nbsp;<span class="archive">[<a href="{{ entry.archive }}">archive</a>]</span>{%- endif -%}
        </span>
      </div>
      <blockquote class="excerpt" markdown="1">{{ entry.excerpt }}</blockquote>
    </li>
  {%- endfor -%}
</ul>
