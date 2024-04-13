---
layout: post
title: Refactoring with Tangrams
custom-css-list:
  - /assets/tangrams/tangrams.css
---

{% assign scale = 100 %}

Remember [tangrams](https://en.wikipedia.org/wiki/Tangram)? Remember how they would mess with your intuition, that the [silhouettes they drew seemed to lie](https://en.wikipedia.org/wiki/Tangram#Paradoxes)?

I'm working on a large refactor that is composed of two similarly-sized and similarly-structured systems. Imagine two similar tiles.

<p class="svg-container">
  <svg width="{{ scale | times: 0.707 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 0.707 0.707">
    {% include tangram-piece.html class="one" points="0,0.707 0.707,0.707 0.707,0" %}
  </svg>

  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include tangram-piece.html class="two" points="0,1 1,1 1,0" %}
  </svg>
</p>

You can arrange these in a variety of ways, some more appealing or easily described than others.

<p class="svg-container">
  <svg width="{{ scale | times: 1.5 | round }}px" height="{{ scale }}px" viewBox="0 0 1.5 1">
    {% include tangram-piece.html class="one" points="1,0 1,1 1.5 0.5" %}
    {% include tangram-piece.html class="two" points="0,0 1,0 1,1" %}
  </svg>
  <svg width="{{ scale | times: 1.707 | round }}px" height="{{ scale }}px" viewBox="-0.707 0 1.707 1">
    {% include tangram-piece.html class="one" points="0,1 -0.707,1 0,0.292" %}
    {% include tangram-piece.html class="two" points="0,0 0,1 1,1" %}
  </svg>
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 1.207 | round }}px" viewBox="-0.707 -0.707 1.414 1.207">
    {% include tangram-piece.html class="one" points="-0.5,0 0.5,0 0,0.5" %}
    {% include tangram-piece.html class="two" points="-0.707,0 0.707,0 0,-0.707" %}
  </svg>
</p>

And so it was that I found myself with a software architecture resembling this configuration...

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include tangram-piece.html class="one" points="1,0 1,0.707 0.292,0.707" %}
    {% include tangram-piece.html class="two" points="0,1 0,0 1,0" %}
  </svg>
</p>

The smaller shape represents underlying framework for the whole system. Call it the <span class="one">foundation</span>. The larger one is where all the domain logic lives. Call it the <span class="two">specialization</span>.

In this analogy, the <span class="one">foundation</span> sort-of supports the <span class="two">specialization</span> in that it's mostly on the bottom, but parts of it end up pretty high up and the <span class="two">specialization</span> actually ends up bypassing the <span class="one">foundation</span> in some places -- that's where it sticks out awkwardly on the bottom.

Through years of organic software growth, this system had grown into this stable but effectively unchangeable configuration. Even trying to move the tiles around to be bottom-heavy instead, or to stick out awkwardly in another direction that would at least allow it to sit flat, were pretty significant undertakings that required moving the entire subsystem and making the entire thing unstable in the process.

I figured the best I could do was to sand off the pointy bits and deal with the remaining, irregularly-shaped pieces that still got too close to the tops and bottoms, where they shouldn't.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale | times: 0.707 | round}}px" viewBox="0 0 1 0.707">
    {% include tangram-piece.html class="one" points="1,0 1,0.707 0.292,0.707" %}
    {% include tangram-piece.html class="two" points="0,0.707 0,0 1,0 0.292,0.707" %}
  </svg>
</p>

Then I saw the silhouette.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include tangram-piece.html class="silhouette" points="0,0 1,0 1,0.707 0.292,0.707 0,1" %}
  </svg>
</p>

You can construct that with these pieces instead.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include tangram-piece.html class="three" points="0,0 1,0 1,0.707 0,0.707" %}
    {% include tangram-piece.html class="four" points="0,0.707 0.292,0.707 0,1" %}
  </svg>
</p>

This layout is still a little awkward, but the the relationship of the silhouette to the constituent tiles is _much less surprising_! And all we had to do to get here is to redraw the lines between the shapes. All the mass stayed where it was. We have rearchitected the system away from one with two badly-interacting "layers" to one with a single <span class="three">main body</span> and <span class="four">hacks</span> (most likely) bolted onto the side. (Ah, software in the real world.)

Should we want to, it's now a lot easier to move the <span class="four">hacks</span> around and change the silhouette, since it has relatively little connection to the <span class="three">main body</span>. If we want to make a change to the silhouette for some reason (that is: the system, holistically, as it appears from the outside), we can do it with less effort and more flexibility.

<p class="svg-container">
  <svg width="{{ scale | times: 1.584 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="-0.292 0 1.584 0.707">
    {% include tangram-piece.html class="three" points="0,0 1,0 1,0.707 0,0.707" %}
    {% include tangram-piece.html class="four" points="1,0.707 1.292,0.707 1,0.414" %}
  </svg>
</p>

Now it lies flat.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include tangram-piece.html class="three" points="0,1 1,1 1,0.292 0,0.292" %}
    {% include tangram-piece.html class="four" points="0.292,0.292 0.707,0.292 0.5,0.094" %}
  </svg>
</p>

Now it lies flat _and_ is symmetrical (though some of it is loosely coupled, in the sense that there's nothing that's snapping the alignment of the <span class="four">hacks</span> to the center line).

Let's rewind a bit. What if we _did_ put in the effort to move the original tiles around a bit?

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include tangram-piece.html class="one" points="0.707,0.707 1.414,0 1.414,0.707" %}
    {% include tangram-piece.html class="two" points="0,0 0.707,0.707 1.414,0" %}
  </svg>
</p>

In a silhouette, that looks like this.

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include tangram-piece.html class="silhouette" points="0,0 1.414,0 1.414,0.707 0.707,0.707" %}
  </svg>
</p>

You might be able to see where this is going.

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include tangram-piece.html class="five" points="0.707,0 1.414,0 1.414,0.707 0.707,0.707" %}
    {% include tangram-piece.html class="six" points="0,0 0.707,0 0.707,0.707" %}
  </svg>
</p>

A different architecture! Like the other one, it's not really a two-layer architecture anymore. The precence of the <span class="six">square</span> is an improvement, since squares are have even less variance to worry about than rectangles. There's still a <span class="five">triangle</span> sticking out the side, but it matches the side of the <span class="six">square</span> perfectly: a good abstraction boundary, perhaps? Or: a minimally-but-fully-expressive API that is used mostly at a high level, but doesn't prevent consumers from using the low-level parts?

{% include next-previous.html %}

