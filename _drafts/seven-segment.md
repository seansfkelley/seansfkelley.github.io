---
layout: post
title: Making Up New Numbers With 7-Segment Displays
custom-css-list:
  - /assets/seven-segment/seven-segment.css
patterns:
  - efg
  - cfg
  - cdfg
  - cdef
  - beg
  - befg
  - bdeg
  - bdefg
  - bcg
  - bceg
  - bcdg
  - bcdefg
  - aef
  - acfg
  - acefg
  - abeg
  - abef
  - abdef
  - abcg
  - abceg
  - abcef
  - abcd
  - abcdf
  - abcde
---

The ubiquitous [7-segment display](https://en.wikipedia.org/wiki/Seven-segment_display) is a pretty clever little piece of design, able to display all 10 digits in a flat plane with only, yup, 7 segments. Compare the predecessor[^1] [Nixie tube](https://en.wikipedia.org/wiki/Nixie_tube), which is also cool for different reasons, but needs 10 elements to display all 10 digits.

Unlike with a Nixie tube, numbers have to be hammered into shape to fit into a 7-segment display. This got me thinking: can we make up number-like symbols by enumerating every combination of 7 segments (with a few rules to pick only the interesting ones) and then backing out something more natural-looking from that?

Yes.

{% for segments in page.patterns %}
  {% svg "/assets/seven-segment/seven-segment.svg" data-segments="{{ segments }}" %}
{% endfor %}

These were made according to a few simple (and somewhat arbitrary) rules derived from observing the standard 10 digit patterns. They must be:

- full height
- connected into a single glyph (no floating "dots" or bars)
- are not already a number or letter (obviously)

If you're curious, I wrote a [little Python script](/assets/seven-segment/generate.txt) to enumerate every possible shape, then prune ones violating the above rules.

Something interesting I notice is that my brain is really good at reinterpreting the "backwards" shapes: for instance, I have a hard time not parsing {% svg "/assets/seven-segment/seven-segment.svg" data-segments="fegb" data-inline="" %} as 4.

{% include next-previous.html %}

[^1]: According to the infallible Wikipedia, 7-segment displays were invented decades before the Nixie tube, but were not practical until LEDs were invented decades _after_ the Nixie tube. It's also worth noting that the Nixie tube is a more flexible design, should you need to display a wider or different range of characters.

