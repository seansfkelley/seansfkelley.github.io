---
layout: post
title: Refactoring with Tangrams
custom-css-list:
  - /assets/tangrams/tangrams.css
---

TODO: Mobile layout.

TODO: Color-code each half. Draw the stroke inside the bounds of each shape a la https://stackoverflow.com/a/7273346. This makes the reveal about the black and white silhouette more surprising.

Remember [tangrams](https://en.wikipedia.org/wiki/Tangram)? Remember how they would mess with your intuition, that the [silhouettes they drew seemed to lie](https://en.wikipedia.org/wiki/Tangram#Paradoxes)?

I'm working on a large refactor that is composed of two primary layers. Imagine two similar tiles.

<p class="svg-container">
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 1"
      transform="scale(0.70710678,  0.70710678)"
    />
  </svg>
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
    />
  </svg>
</p>

Call the left one "layer 1" and the right one "layer 2". In my case, layer 1 is the foundation for layer 2. Note that it's smaller.

You can arrange these in a variety of ways, some more appealing or easily described than others.

<p class="svg-container">
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 0"
      transform="scale(0.70710678,  0.70710678)"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="0.5 0.5"
      transform="rotate(180)"
    />
  </svg>
  <svg
    class="outline"
    width="200px"
    height="100px"
    viewBox="0 0 2 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 1"
      transform="scale(-0.70710678,  0.70710678)"
    />
  </svg>
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
    transform="rotate(-135)"
    tranform-origin="0.5 0.5"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="0.5 0.5"
      transform="rotate(180) scale(0.70710678,  0.70710678)"
    />
  </svg>
</p>

And so it was that I found myself with a software architecture resembling the first configuration...

<p class="svg-container">
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="1 0"
      transform="scale(0.70710678,  0.70710678)"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 1,1 1,0"
      transform-origin="0.5 0.5"
      transform="rotate(180)"
    />
  </svg>
</p>

The foundational layer 1, on the bottom, is smaller and simpler, which creates a top-heavy design. The system has some sharp edges, and there are bits that stick out awkwardly, yet are tightly coupled and can't be moved independently. Layer 2 reaches too far down, sometimes even past the foundation to what's below.

Through years of organic software growth, the shapes had grown into this configuration. Even trying to move the tiles around to be bottom-heavy instead, or to stick out awkwardly in another direction that would at least allow it to sit flat, were pretty significant undertakings. I figured I could sand off the pointy bits and hope for the best with the irregular remainders.

Then I saw the silhouette.

<p class="svg-container">
  <svg
    class="silhouette"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1,0 1,0.70710678 0.29289322,0.70710678 0,1"
    />
  </svg>
</p>

You can construct that with these pieces instead.

<p class="svg-container">
  <svg
    class="outline"
    width="100px"
    height="100px"
    viewBox="0 0 1 1"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1,0 1,0.70710678 0,0.70710678"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,1 0,0.70710678 0.29289322,0.70710678"
    />
  </svg>
</p>

Still a little awkward, yes, but the relationship of the silhouette to the constituent tiles is _much less surprising_! And all we had to do to get here is to redraw the lines. Most of the stuff stayed where it was. And by merely redrawing the lines, we have rearchitected the system away from a two-layer system to one largely-consistent whole, with some hacks (most likely) bolted onto the side. Ah, software in the real world.

Now, should we want to, it's a lot easier to move the awkward triangle around and change the silhouette, since it has relatively little connection to the rectangle. If we want to make a change to the silhouette for some reason (that is, the system, holistically), we can do it with less effort and more flexibility.

<p class="svg-container">
  <svg
    class="outline"
    width="129px"
    height="70px"
    viewBox="0 0 1.29289322 0.70710678"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1,0 1,0.70710678 0,0.70710678"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="1,0.41421356 1,0.70710678 1.29289322,0.70710678"
    />
  </svg>
</p>

Now it lies flat.

TODO: Make the triangle a hat.

Now it lies flat _and_ is symmetrical (though some of it is loosely coupled).

Let's rewind a bit. What if we _did_ put in the effort to move the original tiles around a bit?

<p class="svg-container">
  <svg
    class="outline"
    width="141px"
    height="70px"
    viewBox="0 0 1.41421356 0.70710678"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1.41421356,0 0.70710678,0.70710678"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="1.41421356,0 0.70710678,0.70710678 1.41421356,0.70710678"
    />
  </svg>
</p>

In a silhouette, that looks like this.

<p class="svg-container">
  <svg
    class="silhouette"
    width="141px"
    height="70px"
    viewBox="0 0 1.41421356 0.70710678"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 1.41421356,0 1.41421356,0.70710678 0.70710678,0.70710678"
    />
  </svg>
</p>

You might be able to see where this is going.

<p class="svg-container">
  <svg
    class="outline"
    width="141px"
    height="70px"
    viewBox="0 0 1.41421356 0.70710678"
  >
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 0.70710678,0 0.70710678,0.70710678"
    />
    <polygon
      vector-effect="non-scaling-stroke"
      points="0,0 0.70710678,0, 0.70710678,0.70710678, 0,0.70710678"
      transform="translate(0.70710678, 0)"
    />
  </svg>
</p>

A different architecture! Like the other one, it's not really a two-layer architecture anymore. The precence of the square is an improvement, since squares are even simpler to describe than rectangles. There's still a triangle sticking out the side, but it matches the side of the square perfectly: a good abstraction boundary, perhaps, or a minimally-but-fully-expressive API?

