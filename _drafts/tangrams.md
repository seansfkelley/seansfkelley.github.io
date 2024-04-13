---
layout: post
title: Refactoring with Tangrams
custom-css-list:
  - /assets/tangrams/tangrams.css
---

<svg width="0" height="0">
  <defs>
    <polygon
      id="triangle-large"
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 1"
    />
    <clipPath id="clip-large">
      <use href="#triangle-large"/>
    </clipPath>
    <polygon
      id="triangle-small"
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 1"
      transform="scale(0.707, 0.707)"
    />
    <clipPath id="clip-small">
      <use href="#triangle-small"/>
    </clipPath>
    <polygon
      id="rectangle"
      vector-effect="non-scaling-stroke"
      points="0,0 1,0 1,0.707 0,0.707"
    />
    <clipPath id="clip-rectangle">
      <use href="#rectangle"/>
    </clipPath>
  </defs>
</svg>

TODO: Mobile layout.

TODO: Give the layers non-numerical names. And color-code them when they appear in the text.

Remember [tangrams](https://en.wikipedia.org/wiki/Tangram)? Remember how they would mess with your intuition, that the [silhouettes they drew seemed to lie](https://en.wikipedia.org/wiki/Tangram#Paradoxes)?

I'm working on a large refactor that is composed of two primary layers. Imagine two similar tiles.

{% assign scale = 100 %}

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="1-1" class="one" points="0.292,1 1,1 1,0.292" %}
  </svg>

  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="2-1" class="two" points="0,1 1,1 1,0" %}
  </svg>
</p>

Call the left one <span class="one">layer 1</span> and the right one <span class="two">layer 2</span>.

You can arrange these in a variety of ways, some more appealing or easily described than others.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="3-1" class="one" points="1,0 1,0.707 0.292,0.707" %}
    {% include_relative tangram/piece.html id="3-2" class="two" points="0,1 0,0 1,0" %}
  </svg>
  <svg width="{{ scale | times: 2 }}px" height="{{ scale }}px" viewBox="-1 0 2 1">
    {% include_relative tangram/piece.html id="4-1" class="one" points="0,1 -0.707,1 0,0.292" %}
    {% include_relative tangram/piece.html id="4-2" class="two" points="0,0 0,1 1,1" %}
  </svg>
  <svg width="{{ scale | times: 1.41 | round }}px" height="{{ scale | times: 1.41 | round }}px" viewBox="-0.707 -0.707 1.41 1.41">
    {% include_relative tangram/piece.html id="5-1" class="one" points="-0.5,0 0.5,0 0,0.5" %}
    {% include_relative tangram/piece.html id="5-2" class="two" points="-0.707,0 0.707,0 0,-0.707" %}
  </svg>
</p>

In my case, <span class="one">layer 1</span> is the foundation for <span class="two">layer 2</span>. Note that it's smaller.

And so it was that I found myself with a software architecture resembling the first configuration...

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="6-1" class="one" points="1,0 1,0.707 0.292,0.707" %}
    {% include_relative tangram/piece.html id="6-2" class="two" points="0,1 0,0 1,0" %}
  </svg>
</p>

The foundational <span class="one">layer 1</span>, on the bottom, is smaller and simpler, which creates a top-heavy design. The system has some sharp edges, and there are bits that stick out awkwardly, yet are tightly coupled and can't be moved independently. <span class="two">Layer 2</span> reaches too far down, sometimes even past the foundation to what's below.

Through years of organic software growth, the shapes had grown into this configuration. Even trying to move the tiles around to be bottom-heavy instead, or to stick out awkwardly in another direction that would at least allow it to sit flat, were pretty significant undertakings. I figured I could sand off the pointy bits and hope for the best with the irregular remainders.

Then I saw the silhouette.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="7-1" class="silhouette" points="0,0 1,0 1,0.707 0.292,0.707 0,1" %}
  </svg>
</p>

You can construct that with these pieces instead.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="8-1" class="three" points="0,0 1,0 1,0.707 0,0.707" %}
    {% include_relative tangram/piece.html id="8-2" class="four" points="0,0.707 0.292,0.707 0,1" %}
  </svg>
</p>

Still a little awkward, yes, but the relationship of the silhouette to the constituent tiles is _much less surprising_! And all we had to do to get here is to redraw the lines. Most of the stuff stayed where it was. And by merely redrawing the lines, we have rearchitected the system away from a two-layer system to one <span class="three">main body</span>, with some <span class="four">hacks</span> (most likely) bolted onto the side. Ah, software in the real world.

Now, should we want to, it's a lot easier to move the <span class="four">hacks</span> around and change the silhouette, since it has relatively little connection to the <span class="three">main body</span>. If we want to make a change to the silhouette for some reason (that is, the system, holistically), we can do it with less effort and more flexibility.

<p class="svg-container">
  <svg width="{{ scale | times: 1.584 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="-0.292 0 1.584 0.707">
    {% include_relative tangram/piece.html id="9-1" class="three" points="0,0 1,0 1,0.707 0,0.707" %}
    {% include_relative tangram/piece.html id="9-2" class="four" points="1,0.707 1.292,0.707 1,0.414" %}
  </svg>
</p>

Now it lies flat.

<p class="svg-container">
  <svg width="{{ scale }}px" height="{{ scale }}px" viewBox="0 0 1 1">
    {% include_relative tangram/piece.html id="10-1" class="three" points="0,1 1,1 1,0.292 0,0.292" %}
    {% include_relative tangram/piece.html id="10-2" class="four" points="0.292,0.292 0.707,0.292 0.5,0.094" %}
  </svg>
</p>

Now it lies flat _and_ is symmetrical (though some of it is loosely coupled, in the sense that there's nothing that's snapping the alignment of the <span class="four">hacks</span> to the center).

Let's rewind a bit. What if we _did_ put in the effort to move the original tiles around a bit?

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include_relative tangram/piece.html id="11-1" class="one" points="0.707,0.707 1.414,0 1.414,0.707" %}
    {% include_relative tangram/piece.html id="11-2" class="two" points="0,0 0.707,0.707 1.414,0" %}
  </svg>
</p>

In a silhouette, that looks like this.

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include_relative tangram/piece.html id="12-1" class="silhouette" points="0,0 1.414,0 1.414,0.707 0.707,0.707" %}
  </svg>
</p>

You might be able to see where this is going.

<p class="svg-container">
  <svg width="{{ scale | times: 1.414 | round }}px" height="{{ scale | times: 0.707 | round }}px" viewBox="0 0 1.414 0.707">
    {% include_relative tangram/piece.html id="13-1" class="five" points="0.707,0 1.414,0 1.414,0.707 0.707,0.707" %}
    {% include_relative tangram/piece.html id="13-2" class="six" points="0,0 0.707,0 0.707,0.707" %}
  </svg>
</p>

A different architecture! Like the other one, it's not really a two-layer architecture anymore. The precence of the <span class="six">square</span> is an improvement, since squares are even simpler to describe than rectangles. There's still a <span class="five">triangle</span> sticking out the side, but it matches the side of the <span class="six">square</span> perfectly: a good abstraction boundary, perhaps, or a minimally-but-fully-expressive API?

