---
layout: post
title: Making Up New Numbers With 7-Segment Displays
tags: interactive
custom-css-list:
  - /assets/seven-segment/seven-segment.css
custom-js-list:
  - /assets/seven-segment/seven-segment.js
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

The ubiquitous [7-segment display](https://en.wikipedia.org/wiki/Seven-segment_display) is a pretty clever little piece of design, able to display all 10 digits in a flat plane with only (you guessed it) 7 segments. Compare the predecessor[^1] [Nixie tube](https://en.wikipedia.org/wiki/Nixie_tube), which is also cool for different reasons, but needs 10 elements to display all 10 digits. ([14-segment displays](https://en.wikipedia.org/wiki/Fourteen-segment_display) can do all 26 letters and 10 numbers.)

Unlike with a Nixie tube, numbers have to be hammered into slightly awkward shapes to fit into a 7-segment display. But we can turn this constraint on its head to find something new! By enumerating all the alphanumeric-like shapes that aren't already claimed, we might be able to make up some new alphanumeric shapes that feel familiar, but aren't.

{% for segments in page.patterns %}
  {% svg "/assets/seven-segment/seven-segment.svg" data-segments="{{ segments }}" %}
{% endfor %}

These were made using a [Python script](/assets/seven-segment/generate.txt) according to a few simple (and somewhat arbitrary) rules derived from observing the standard 10 digit patterns. They must be:

- full height
- connected into a single glyph (no floating "dots" or bars)
- not already a number or letter (obviously)

As an aside, something interesting I notice is that my brain is really good at reinterpreting the "backwards" or "broken" shapes: for instance, it really wants to read {% svg "/assets/seven-segment/seven-segment.svg" data-segments="fegb" data-inline="" %} as 4 and {% svg "/assets/seven-segment/seven-segment.svg" data-segments="abcge" data-inline="" %} as A.

Anyway, here is me riffing on the 7-segment shapes to see what more-natural shapes come out in handwriting.

![handwritten](/assets/seven-segment/handwritten.jpg)

I was surprised to find that many of these shapes, written at speed, are near indifferentiable from existing characters (e.g. {% svg "/assets/seven-segment/seven-segment.svg" data-segments="abge" data-inline="" %} as question mark) or even multiple distinct characters (e.g. {% svg "/assets/seven-segment/seven-segment.svg" data-segments="fgcd" data-inline="" %} as either uppercase S or lowercase b). There's also now-obvious Greek/Cyrillic ones that I didn't eliminate up front: {% svg "/assets/seven-segment/seven-segment.svg" data-segments="efgb" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="afe" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="abcge" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="efabc" data-inline="" %} are, respectively, &mu; &Gamma; &lambda; &Pi;. My favorite handwritten shape is {% svg "/assets/seven-segment/seven-segment.svg" data-segments="bcdg" data-inline="" %}, interpreted as a capital J with a crossbar.

<div class="hidden" id="interactive">
  Here's an interactive 7-segment you can click on to noodle around if you'd like.

  <!--We have to wrap instead of set it on the SVG because we don't want to center the text, and the inliner can only overwrite classes anyway. -->
  <div class="center">
    {% svg "/assets/seven-segment/seven-segment.svg" width="60%" height="100%" data-interactive="" %}
  </div>
</div>

{% include next-previous.html %}

[^1]: According to the infallible Wikipedia, 7-segment displays were invented decades before the Nixie tube, but were not practical until LEDs were invented decades _after_ the Nixie tube. It's also worth noting that the Nixie tube is a more flexible design, should you need to display a wider or different range of characters.

