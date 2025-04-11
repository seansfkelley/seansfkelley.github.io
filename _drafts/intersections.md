---
layout: post
title: Intersections
custom-css-list:
  - /assets/intersections/intersections.css
---

I thought it would be neat to have a simulation of a traffic intersection, so I made one. The intersections near my house are kind of unnecessarily complex, so this also serves as a reference to remind myself of how to save several minutes when I'm out walking.

<svg width="400px" height="400px" viewBox="0 0 100 100">
  <defs>
    <g id="pedestrian-signal">
      <rect class="outline" x="0" y="0" width="5" height="5" rx="1" />
      <rect class="walk" x="1" y="1" width="3" height="3" />
      <rect class="dont-walk" x="1" y="1" width="3" height="3" />
    </g>
    <g id="traffic-signal">
      <rect class="outline" x="0" y="0" width="4" height="10" rx="1" />
      <circle class="green" cx="2" cy="2" r="1.25" />
      <circle class="yellow" cx="2" cy="5" r="1.25" />
      <circle class="red" cx="2" cy="8" r="1.25" />
    </g>
  </defs>

  <rect class="asphalt" x="0" y="0" width="100" height="100" />
  <rect class="sidewalk" x="5" y="5" width="10" height="10" />
  <line class="crosswalk" x1="50" y1="50" x2="75" y2="75" />
  <use href="#pedestrian-signal" class="show-walk" x="20" y="20"/>
  <use href="#traffic-signal" class="show-green" x="40" y="40"/>
</svg>
