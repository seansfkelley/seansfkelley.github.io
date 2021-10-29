---
layout: post
title: A Tale of Two Lights
custom-css-list:
  - /assets/a-tale-of-two-lights/a-tale-of-two-lights.css
---

I'm at an Airbnb. There is a stairwell that has a light at the bottom and a light at the top (the latter of which is also the hallway light). One desires to control both these lights from both ends so that you can always turn the light off after you, or turn the light on before you, regardless of which direction you're going. There are indeed four light switches, but they don't work like that. If they did, I wouldn't have had to write this.

One switch is by the front door where the upper hallway is. Two are at the top of the stairs, and one at the bottom. Hm... that doesn't sound like the pair of independent three-way switches you might expect. There's only one switch at the bottom?

I've been here for literally weeks and I haven't been able to figure out the way that these lights are connected. Most days I just mash them at random until I get them into the state I want. Yesterday I got so annoyed that I actually tabulated (and triple-checked!) data for how the switches perform. In binary.

<div id="data-table" markdown="1">

| A | B | C | D | Top Light | Bottom Light |
|---|---|---|---|-----------|--------------|
| 0 | 0 | 0 | 0 |     0     |       0      |
| 1 | 0 | 0 | 0 |     0     |       1      |
| 0 | 1 | 0 | 0 |     0     |       0      |
| 1 | 1 | 0 | 0 |     0     |       0      |
| 0 | 0 | 1 | 0 |     1     |       0      |
| 1 | 0 | 1 | 0 |     0     |       1      |
| 0 | 1 | 1 | 0 |     1     |       1      |
| 1 | 1 | 1 | 0 |     0     |       0      |
| 0 | 0 | 0 | 1 |     0     |       0      |
| 1 | 0 | 0 | 1 |     1     |       1      |
| 0 | 1 | 0 | 1 |     0     |       0      |
| 1 | 1 | 0 | 1 |     0     |       0      |
| 0 | 0 | 1 | 1 |     1     |       1      |
| 1 | 0 | 1 | 1 |     1     |       1      |
| 0 | 1 | 1 | 1 |     1     |       1      |
| 1 | 1 | 1 | 1 |     0     |       0      |

</div>

I stared at this for a while, and even drew out little truth tables for AND, OR, XOR and [IMPLY](https://en.wikipedia.org/wiki/IMPLY_gate) (just learned about that one) as well as their NOT'd equivalents in an attempt to pattern match. The hope was to eventually draw a logic gate diagram (which I am sort of familiar with) and then back out a wiring diagram from that.

Instead, I floundered a bit on the internet and discovered that all these years that people have been saying "boolean algebra", they literally meant that you can do algebra with it. Like numbers. But not quite, because the laws are different. Then I discovered [products of sums and sums of products](https://www.electronics-tutorials.ws/boolean/product-of-sum.html)! I eagerly translated my data for the bottom light into the naive algebraic expression, and then attempted to copy-cat the simplificiations from that site:

<div class="center" markdown="1">
A&#772;B&#772;CD&#772; + A&#772;BCD&#772; + AB&#772;C&#772;D + A&#772;B&#772;CD + AB&#772;CD + A&#772;BCD[^1]

<span class="small">alright let's get my hands dirty and factor some stuff out</span>

(B&#772; + B)A&#772;CD&#772; + AB&#772;C&#772;D + (A&#772; + A)B&#772;CD + A&#772;BCD

<span class="small">cool, I just learned from The Internet that (A + A&#772;) is always true so we can drop that right out</span>

A&#772;CD&#772; + AB&#772;C&#772;D + B&#772;CD + A&#772;BCD

<span class="small">okay I'm out of ideas</span>
</div>

Even a light switch system this confusing can't be that complicated. Also, there's no way that people who design systems of logic gates for a living still do it this way. (Yes I know the computers are actually the ones doing it for the professionals.)

As it turns out, if I had taken a digital electronics course and/or paid attention in my Discrete Algebra course, I would have learned about [Karnaugh maps](https://en.wikipedia.org/wiki/Karnaugh_map), which are a pretty clever trick. They encode truth tables in just such a way every move from a square to an adjacent square is a single bit flip (including falling off the edges -- so it's actually a torus!), which means that blocks of zeroes or ones that are in lines or squares are all closely related. Which is to say, they can be represented with relatively fewer terms. So I whipped up Karnaugh map for each light, because the Wikipedia page happened to have an example of how to do with 16 entries. What are the chances?

<div class="karnaugh-maps" markdown="1">
<div class="karnaugh" markdown="1">
<p class="karnaugh-label top">AB</p>
<div class="left-label-wrapper" markdown="1">
<p class="karnaugh-label left">CD</p>

|    | 00 | 01 | 11 | 10 |
| 00 |  0 |  0 |  0 |  1 |
| 01 |  0 |  0 |  0 |  1 |
| 11 |  1 |  1 |  0 |  1 |
| 10 |  0 |  1 |  0 |  1 |

</div>
<p class="karnaugh-label bottom">Top Light</p>
</div>
<div class="karnaugh" markdown="1">
<p class="karnaugh-label top">AB</p>
<div class="left-label-wrapper" markdown="1">
<p class="karnaugh-label left">CD</p>

|    | 00 | 01 | 11 | 10 |
| 00 |  0 |  0 |  0 |  0 |
| 01 |  0 |  0 |  0 |  1 |
| 11 |  1 |  1 |  0 |  1 |
| 10 |  1 |  1 |  0 |  0 |

</div>
<p class="karnaugh-label bottom">Bottom Light</p>
</div>
</div>

Then you find rectangles like they describe on Wikipedia, and back out the boolean algebra expressions that describe them:

<div class="center" markdown="1">
AB&#772; + A&#772;BC + A&#772;B&#772;CD

<span class="small">(or)</span>

AB&#772; + A&#772;CD + A&#772;BCD&#772;
</div>

That's the top light. Yes, it has two different representations.

<div class="center" markdown="1">
A&#772;C + AB&#772;D
</div>

And that's the bottom. At least it's simpler.

In fact, I was surprised by how much simpler an expression this process yielded. Scroll back up and look at my first attempts with boolean algebra expressions -- it would have taken a lot of staring and comparing _this_ group of symbols, some of which are negated just so, with _that_ group of symbols, some of which are negated just so, in order to factor out commonalities which could be reduced.

That said, look at how ridiculous this is. Let's attempt to interpret A&#772;C + AB&#772;D, which is the bottom light.[^2]

First off, notice that all four symbols are present. This means that all four switches can control this light, but more importantly, it means I'm _not_ crazy and it really is weird and confusing. Maybe the electrician was the crazy one.

Secondly, notice there are two groups, one of which has A and the other of which has A&#772;. The plus sign can be read as an "or", which is to say, either the switch combination A&#772;C or the combination AB&#772;D is necessary to turn the light on. An English interpretation: if A is off, C controls the switch. If A is on, both B and D are necessary to control the switch.

Since this is the downstairs light, and the only switch downstairs is D, you better hope that A and B are set correctly when you're downstairs -- otherwise flipping D isn't going to do anything at all. This exact experience was my daily life. Thankfully, if you're upstairs, you can turn off the downstairs light without going downstairs -- you just have to make sure you don't try to hit C when you're in the AB&#772;D state, or B while you're in the A&#772;C state, since they won't do anything.

Or you can just mash the switches and hope for the best.

-------------------------------------------------------------------------------

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: Excuse the tiny, tiny negation bars. I couldn't figure out why the proper combining overline `&#773;` wouldn't work.
[^2]: The interpretation of the control scheme for the top light is left as an exercise to the reader.
