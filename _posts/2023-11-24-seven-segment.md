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

The ubiquitous [7-segment display](https://en.wikipedia.org/wiki/Seven-segment_display) is a pretty clever little piece of design, able to display all 10 digits in a flat plane with only (you guessed it) 7 segments. Compare the predecessor[^1] [Nixie tube](https://en.wikipedia.org/wiki/Nixie_tube), which is also cool for different reasons, but needs 10 elements to display all 10 digits. ([14-segment displays](https://en.wikipedia.org/wiki/Fourteen-segment_display) can do all 26 letters and 10 numbers.)

Unlike with a Nixie tube, numbers have to be hammered into slightly awkward shapes to fit into a 7-segment display. But we can turn this constraint on its head to find something new! By enumerating all the alphanumeric-like shapes that aren't already claimed, we might be able to make up some new alphanumeric shapes that feel familiar, but aren't.

{% for segments in page.patterns %}
  {% svg "/assets/seven-segment/seven-segment.svg" data-segments="{{ segments }}" %}
{% endfor %}

These were made using a [Python script](/assets/seven-segment/generate.txt) according to a few simple (and somewhat arbitrary) rules derived from observing the standard 10 digit patterns. They must be:

- full height
- connected into a single glyph (no floating "dots" or bars)
- not already a number or letter (obviously)

As an aside, something interesting I notice is that my brain is really good at reinterpreting the "backwards" shapes: for instance, I have a hard time not parsing {% svg "/assets/seven-segment/seven-segment.svg" data-segments="fegb" data-inline="" %} as 4.

Anyway, here is me riffing on the 7-segment shapes to see what more-natural shapes come out in handwriting.

![handwritten](/assets/seven-segment/handwritten.jpg)

I was surprised to find that many of these shapes, written at speed, are near indifferentiable from existing characters (e.g. {% svg "/assets/seven-segment/seven-segment.svg" data-segments="abge" data-inline="" %} is a question mark), Greek/Cyrillic ones ({% svg "/assets/seven-segment/seven-segment.svg" data-segments="efgb" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="afe" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="abcge" data-inline="" %} {% svg "/assets/seven-segment/seven-segment.svg" data-segments="efabc" data-inline="" %} are &mu; &Gamma; &lambda; &Pi;) or even multiple distinct characters (e.g. {% svg "/assets/seven-segment/seven-segment.svg" data-segments="fgcd" data-inline="" %} could be an uppercase S or lowercase b). Have we already mostly exhausted the space of Latin/Greek-like characters?

{% include next-previous.html %}

[^1]: According to the infallible Wikipedia, 7-segment displays were invented decades before the Nixie tube, but were not practical until LEDs were invented decades _after_ the Nixie tube. It's also worth noting that the Nixie tube is a more flexible design, should you need to display a wider or different range of characters.

