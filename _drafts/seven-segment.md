---
layout: post
title: Making Up New Numbers With 7-Segment Displays
custom-css-list:
  - /assets/seven-segment/seven-segment.css
---

The ubiquitous [7-segment display](https://en.wikipedia.org/wiki/Seven-segment_display) is a pretty clever little piece of design, able to display all 10 digits in a flat plane with only, yup, 7 segments. Compare the predecessor[^1] [Nixie tube](https://en.wikipedia.org/wiki/Nixie_tube), which is also cool for different reasons, but needs 10 elements to display all 10 digits.

Unlike with a Nixie tube, numbers have to be hammered into shape to fit into a 7-segment display. This got me thinking: can we make up number-like symbols by enumerating every combination of 7 segments (with a few rules) and then backing out something more natural-looking from that?

Yes.

(put them here)

These were made according to a few simple (and somewhat arbitrary) rules derived from observing the standard 10 digit patterns. They must be:

- full height
- connected into a single glyph (no floating "dots" or bars)
- novel (obviously)

If you're curious, I wrote a [little Python script](/assets/seven-segment/generate.txt) to enumerate every possible shape, then prune ones violating the above rules.

{% include next-previous.html %}

[^1]: According to the infallible Wikipedia, 7-segment displays were invented decades before the Nixie tube, but were not practical until LEDs were invented decades _after_ the Nixie tube. It's also worth noting that the Nixie tube is a more flexible design, should you need to display a wider or different range of characters.

