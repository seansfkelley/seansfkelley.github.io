---
layout: post
title: Glove80 Keyboard Review
---

I bought myself one of [these](https://www.moergo.com/):

![Glove80](/assets/glove80/glove80.jpg)

I previously used (and adored) one of [these](https://ergodox-ez.com/):

![ErgoDox](/assets/glove80/ergodox.jpg)

Most of the thoughts I have below will be on the relative differences between these two.

### Feel

**The keyboard halves are very light, and you can feel it even when they're on the table.** When you go back to a heavier keyboard you realize that the Glove80 doesn't dampen the vibrations from tapping at all.

**The low profile switches and keycaps rattle slightly when you move the keyboard around.**

**The low profile keys do not bottom out in the same way that full-size keycaps do.** When I switch back to the ErgoDox, the key travel, bottoming out and general heft is considerably more satisfying and stable. This is obvious in retrospect, but I've never had a low profile keyboard before. My ErgoDox has [Cherry MX Browns](https://www.cherry-world.com/mx2a-brown) because the bottoming out makes them a nice amount of clacky without being too obnoxious. The [Kailh Choc v1 Browns](https://chosfox.com/products/kailh-chocs?variant=42514647646402)[^1] I have on the Glove80 are almost completely silent, which is more practical but also a bummer. I would have considered the clicky Blues to make up for it had I known this.

[^1]: I'm guessing from the "v1" that this is an older model. They aren't listed on the Kailh site at all and I only found a few places online that sold them.

### Build Quality

**The build does feel a bit cheap given the cost.** I accidentally dropped one half a couple inches onto the desk and now there are permanently dulled corners with obvious damage. Why didn't they just bevel it like the ErgoDox edges? Pieces of the case aren't completely flush with one another, though that's on the bottom side so you never actually see it.

**The case that it comes with is very nice, if bulky.** The two halves fit very snugly into their molded holders and there's a little room to spare for replacement parts and the relevant tools (like the keycap puller).

### Durability

It's easy to break the switches. I broke one within a week by pulling out the keycaps too hard (which, to be fair, they warn you about). The keycaps _really_ grip the switches in not always a good way, and unlike the ErgoDox the switches aren't hot-swappable so it was a two-week-long affair to order replacement switches and then get a friend of a friend to solder one on for me. Lesson learned: buy the extra switches when you buy the keyboard.

I would think twice before putting the keyboard directly in a backpack or duffel. I have never thought twice about doing the same with the ErgoDox, and it has never been a problem. The bulky case only solves this problem for e.g. going into the office for the day; I don't know that I would dedicate all the space that the keyboard needs when space is limited on longer trips, but the case does mean it can be safely in checked baggage (presumably).

### Size

I really like that it's only exactly as large as needed to pack in all the keys. Whenever I switch back to the ErgoDox, it feels like an ungainly behemoth -- does it really need an extra inch all th way around all the edges? The small size does make travel more tempting, despite the durability question. It also makes the case feel even more ridiculously large.

I have large hands, and the integrated wrist rests are too small. I actually usually use the ErgoDox big rubber bricks so I can place them just where I need to. The rubber is also grippier, which matters as soon as your hands start sweating even a little bit and sliding off the smooth integrated wrist rests that come with it.

### Layout

This is the first concave keyboard I've owned. I think I like it, but even after a few weeks I'm still not sure. I still often hit adjacent keys because they are unexpectedly close to each other, though more often when programming and using symbol keys heavily, so it could be my keymap at fault. I never miss a key on the ErgoDox.

The thumb clusters are for sure a major improvement, though they still don't solve the problems from the ErgoDox completely. On the ErgoDox, you functionally have three thumb keys. The farther three are so distant that I honestly don't know why they even exist -- you have to lift your hand considerably to even reach them, so they're very slow and easy to miss. Compare the Glove80: the top three keys are reachable with a slight lift so can be used for uncommon keys that you still don't want to put on a layer, like Escape. But you still have to plan your keymap around only three thumb keys in frequent use.

At first I missed the extra column on the inside edge of the ErgoDox, but I've come to appreciate the symmetry that comes with having only one extra column on each edge. I only had a couple bindings in that column and they were inconvenient enough that I only used one of them regularly. I feel the same way about the top row: it requires too much of a stretch, so I haven't bound anything there.

I do miss the 1.5u keys on the inside and outside columns, as well as the thumb keys. I think I tend to miss keys on the non-home columns because I fling my fingers horizontally and hit the nearest keys they find, which is easier to do correctly when they're bigger.

The per-finger offset and curvature is excellent, and really requires and encourages good touch-typing form. My touch-typing improved considerably when I switched to the ErgoDox, which made it easy to adjust to the Glove80, which is finishing the job.

### Customizability

At first I was a bit annoyed that the Glove80 used this newfangled ZMK instead of the default option of QMK that every other keyboard uses, but after spending some time with it, I've come to really like it. It has a powerful macro system that makes it easy to combine behaviors and create all manner of custom tweaks whose QMK equivalent requires a dedicated code implementation, which limits your options and makes each subsequent feature more difficult to add. Each constituent behavior is also more clearly delineated and factored, so despite also being in C, I find it much easier to follow and add to.

The major practical downside of ZMK for me is that it does not support mouse movement keys. There are open pull requests implementing the behavior, which I had to merge into my fork along with some other tweaks and then layer on my own hacky implementation of the mouse-speed behavior from QMK, because there was no equivalent mechanism in ZMK. It works, but it's too gross to upstream and I'm not sure how to make it un-gross.

I haven't used the graphical configurator for the Glove80 because I stopped using the ErgoDox one months ago when I switched to using mouse keys. I have no idea how well it works.

I haven't done any hardware customizations besides modifying keycaps. The manufacturer sells Apple, Linux, Windows and "nerd" keys, which actually covered enough of my bases that I bothered to put them on instead of doing all blanks like my ErgoDox. I particularly like the Apple-style meta keys and HJKL with arrows on them.

### Bluetooth

The Bluetooth connection is flawless. It can be paired with four computers simultaneously and will switch between them basically instantly with the (default) 2-keystroke combination. It also provides status lights on demand for the connections so you can see which are active/idle/disconnected.

### Battery Life

Battery life is not a problem: weeks for the left (primary) half and months for the right (secondary) half. It's also nice that it's got USB-C: I have no idea why the ErgoDox chose the rare and obnoxious USB mini-B (_not_ micro-B). I had to special-order a mini-B to C cable just for the keyboard to avoid having a permanently attached dongle. Everything in my life has to be USB-C.

### Convenience

There is a significant degree of convenience and elegance to the integrated wrist rests, such that I'm giving them another try as I write this review on the Glove80. Compare the ErgoDox's six loosely-connected pieces requiring lots of plugging in and out. After going back and forth to the office with only the Glove80, I have to say -- even using it with the ErgoDox's separated wrist rests, it's considerably less annoying to have four blocky things to set up instead of wrangling wires that are too long and have to snake back and forth across the desk and obstruct opening and closing the laptop lid.

### Conclusion

The Glove80 does fix pretty much all the problems of the ErgoDox, but it introduces a few to replace it. It clearly trades off durability and heft in favor of portability and convenience.

If you like having lots of keyboards, this is a worthy addition to your collection. If you don't yet have a programmable ergonomic mechanical keyboard and are thinking of getting one, this is a great one to be your only one. If you already do and don't want extra keyboards, it's not a slam dunk replacement.

{% include next-previous.html %}
