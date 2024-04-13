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

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="one" href="#triangle-small" clip-path="url(#clip-small)"/>
  </svg>

  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="two" href="#triangle-large" clip-path="url(#clip-large)"/>
  </svg>
</p>

Call the left one <span class="one">layer 1</span> and the right one <span class="two">layer 2</span>.

You can arrange these in a variety of ways, some more appealing or easily described than others.

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="one" href="#triangle-small" clip-path="url(#clip-small)" transform="translate(0 -0.292893)"/>
    <use class="two" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="rotate(180)"/>
  </svg>
  <svg width="200px" height="100px" viewBox="0 0 2 1">
    <use class="one" href="#triangle-small" clip-path="url(#clip-small)"/>
    <use class="two" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="1 1" transform="rotate(90)"/>
  </svg>
  <svg width="141px" height="141px" viewBox="0 0 1.41 1.41" transform="rotate(-135)">
    <!-- Use a <g> so that the translation isn't also scaled. -->
    <g transform="translate(0.205, 0.205)">
      <!-- It's easier to move this to be flush with the big one by starting with a big one and re-scaling, then moving the already-scaled small one around.  -->
      <use class="one" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="rotate(180) scale(0.707, 0.707)"/>
    </g>
    <use class="two" href="#triangle-large" clip-path="url(#clip-large)" transform="translate(0.205, 0.205)"/>
  </svg>
</p>

In my case, <span class="one">layer 1</span> is the foundation for <span class="two">layer 2</span>. Note that it's smaller.

And so it was that I found myself with a software architecture resembling the first configuration...

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="one" href="#triangle-small" clip-path="url(#clip-small)" transform="translate(0 -0.292893)"/>
    <use class="two" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="rotate(180)"/>
  </svg>
</p>

The foundational <span class="one">layer 1</span>, on the bottom, is smaller and simpler, which creates a top-heavy design. The system has some sharp edges, and there are bits that stick out awkwardly, yet are tightly coupled and can't be moved independently. <span class="two">Layer 2</span> reaches too far down, sometimes even past the foundation to what's below.

Through years of organic software growth, the shapes had grown into this configuration. Even trying to move the tiles around to be bottom-heavy instead, or to stick out awkwardly in another direction that would at least allow it to sit flat, were pretty significant undertakings. I figured I could sand off the pointy bits and hope for the best with the irregular remainders.

Then I saw the silhouette.

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <polygon
      class="silhouette"
      points="0,0 1,0 1,0.707 0.292,0.707 0,1"
    />
  </svg>
</p>

You can construct that with these pieces instead.

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="three" href="#rectangle" clip-path="url(#clip-rectangle)"/>
    <g transform="translate(0, 0.707)">
      <g transform="scale(0.292, 0.292)">
        <use class="four" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="rotate(180)"/>
      </g>
    </g>
  </svg>
</p>

Still a little awkward, yes, but the relationship of the silhouette to the constituent tiles is _much less surprising_! And all we had to do to get here is to redraw the lines. Most of the stuff stayed where it was. And by merely redrawing the lines, we have rearchitected the system away from a two-layer system to one <span class="three">main body</span>, with some <span class="four">hacks</span> (most likely) bolted onto the side. Ah, software in the real world.

Now, should we want to, it's a lot easier to move the <span class="four">hacks</span> around and change the silhouette, since it has relatively little connection to the <span class="three">main body</span>. If we want to make a change to the silhouette for some reason (that is, the system, holistically), we can do it with less effort and more flexibility.

<p class="svg-container">
  <svg width="158px" height="70px" viewBox="-0.292 0 1.584 0.707">
    <use class="three" href="#rectangle" clip-path="url(#clip-rectangle)"/>
    <g transform="translate(1, 0.414)">
      <g transform="scale(0.292, 0.292)">
        <use class="four" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="rotate(90)"/>
      </g>
    </g>
  </svg>
</p>

Now it lies flat.

<p class="svg-container">
  <svg width="100px" height="100px" viewBox="0 0 1 1">
    <use class="three" href="#rectangle" clip-path="url(#clip-rectangle)" transform="translate(0, 0.292)"/>
    <g transform="translate(0, -0.207)">
      <use class="four" href="#triangle-large" clip-path="url(#clip-large)" transform-origin="0.5 0.5" transform="scale(0.292, 0.292) rotate(-135)"/>
    </g>
  </svg>
</p>

Now it lies flat _and_ is symmetrical (though some of it is loosely coupled, in the sense that there's nothing that's snapping the alignment of the <span class="four">hacks</span> to the center).

Let's rewind a bit. What if we _did_ put in the effort to move the original tiles around a bit?

<p class="svg-container">
  <svg
    class="outline"
    width="141px"
    height="70px"
    viewBox="0 0 1.414 0.707"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1.414,0 0.707,0.707"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="1.414,0 0.707,0.707 1.414,0.707"
    />
  </svg>
</p>

In a silhouette, that looks like this.

<p class="svg-container">
  <svg
    class="silhouette"
    width="141px"
    height="70px"
    viewBox="0 0 1.414 0.707"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1.414,0 1.414,0.707 0.707,0.707"
    />
  </svg>
</p>

You might be able to see where this is going.

<p class="svg-container">
  <svg
    class="outline"
    width="141px"
    height="70px"
    viewBox="0 0 1.414 0.707"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 0.707,0 0.707,0.707"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 0.707,0, 0.707,0.707, 0,0.707"
      transform="translate(0.707, 0)"
    />
  </svg>
</p>

A different architecture! Like the other one, it's not really a two-layer architecture anymore. The precence of the square is an improvement, since squares are even simpler to describe than rectangles. There's still a triangle sticking out the side, but it matches the side of the square perfectly: a good abstraction boundary, perhaps, or a minimally-but-fully-expressive API?

