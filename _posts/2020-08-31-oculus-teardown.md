---
layout: post
title: "Oculus Rift CV1 Teardown"
date: 2020-08-31 23:00:00 -0700
---

During quarantine, I came into possession of a used Oculus Rift CV1 setup (that's the original one) that had an infuriating tendency to disconnect if you moved your head around too fast. After some basic debugging techniques (ahem, turning it off and on again), I determined that there was a hardware issue in the headset and, since the CV1 has been discontinued for some time, I would have to fix it myself.

I was disappointed to find that there were no good teardown guides for the CV1. iFixit's guide was light on details and incomplete. The best content I could find was a series of unedited (and, therefore, lengthy) YouTube videos that ended up only being useful for the first couple steps.[^1]

Fast forward through two more pre-broken headsets from eBay and a handful of individually-purchased components, some of which I personally broke and some of which were sold as working but weren't, and I've gotten pretty good at disassembling and reassembling CV1s. Unfortunately, I only ended up with the equivalent of my first headset (complete with hardware flaw) and one other frankensteined, but functioning, headset, so I wouldn't say it was worth the money. But at least it was a fun quarantine project, and I hope someone finds this guide useful if their need to do their own CV1 surgery!

## What You'll Need

- T4 Torx screwdriver
- #0 Phillips head screwdriver with a narrow shaft 3" or longer
- medium-sized flathead screwdriver or spudger
- small flathead screwdriver, ~1/16" wide

The Phillips head will have to fit in a very narrow space, so most replaceable-bit screwdrivers with a bulky socket for the bits won't fit.

The screws are quite small, so a magnetic screwdriver and/or an organizing tray will help keep you from losing them.

## Parts List

Ignoring the parts that can be removed without any tools, these are the parts you will end up with at the end of this teardown.

- 1x head strap/outer housing assembly
- 1x fabric face shroud
- 2x lens assemblies
- 1x moveable lens mount/front housing
- 3x PCB
  - 1x main board
  - 1x breakout board
  - 1x proximity sensor board
- 1x main board support
- 1x ribbon cable brace
- 1x IPD slider assembly
  - 1x outer ring
  - 1x slider thumb
  - 2x springs
  - 1x rack gear/thumb holder
- 19x T4 Torx screws
- 9x small Phillips head screws
- 4x large Phillips head screws
- 1x Phillips shoulder screw

## Step-by-step Teardown

I've torn down headsets half a dozen times following these instructions, but keep in mind that I am not an expert and if you aren't careful you may damage your headset. Proceed with caution!

I strongly suggest that you read each section in its entirety before performing the steps there. This way you'll know what the end goal is and can set up your light source/tools/workspace for best effect.

### 1. Preliminaries

Before getting into the teardown proper, start by removing all the extranous parts: headphones, foam faceplate and cable. I also recommend you unvelcro the top strap and wrap it around the brace for the back of the head to keep it out of the way.

### 2. Face Shroud

Removing the flexible **fabric shroud** is one of the more stressful parts of the process, because you're doing it almost totally blind and it requires a good amount of prying.

First, remove the **6x T4 screws**.

![img-1](/assets/oculus-teardown/img-1-3805-annotated.jpg)

Next, you want to separate the tabs on the left and right sides of the shroud from the outer housing. Here's a view of what the tabs look like once you've separated the two components.

![img-2](/assets/oculus-teardown/img-2-combined.jpg)

There's more than just these tabs holding the shroud in place, so don't pull too hard yet. With your flathead screwdriver, you should be able to just insert it between the two parts, slide it over towards the tabs, and force the components apart.

![img-3](/assets/oculus-teardown/img-3-combined.jpg)

Next, you have to pry the fabric shroud away from the lenses. Each eye hole in the shroud has a plastic ring with three snaps that attach to three anchors on the lens housing. Here's what the tabs look like from the inside.

![img-4](/assets/oculus-teardown/img-4-combined.jpg)

The tab locations are mirrored for the left and right lenses. Here's a reference for where the left lens tabs can be found.

![img-5](/assets/oculus-teardown/img-5-3805-annotated.jpg)

The best technique I've found still requires some patience and luck, unfortunately. The tab on the bottom side of the lens can be reached with the flathead screwdriver if you pry apart the shroud's plastic frame and the outer housing. Photographing the moment of release is difficult, so here's what it looks like right after the tab has been separated.

![img-6](/assets/oculus-teardown/img-6-3665-annotated.jpg)

Once you've separated the first tab, you'll gain some flexibility to move the plsatic ring around. The next snaps are considerably easier and can be done by inserting the screwdriver between the lens and plastic ring, then sliding them around to pop off the tabs, much like you did when separating the shroud from the outer housing.

![img-7](/assets/oculus-teardown/img-7-3668.jpg)

After you've done one eye, you should have considerable leeway to move your tools around and the second eye should come off much more easily.

### 3. IPD Slider

Before removing the outer housing, the **IPD slider** on the bottom right has to be taken out. It's held in **1x T4 screw**, so remove that first.

(image)

Next, release the front two plastic snaps holding the **outer ring** using the small flathead screwdriver or flathead screwdriver by pressing them in and down.

(image)

Once you'd pushed the snaps in, you should see a small crack open up between the main housing and the outer slider ring.

(image)

// TODO: Can this be stylized to be red and annoying?
Warning! Underneath the switch's thumb there are two tiny springs. Make sure you work methodically and/or in an enclosed space to prevent them flying off into the distance.

Put your flathead screwdriver in the crack between those two parts and slowly pry off the outer ring. It's held in by inaccessible snaps on the back of the assembly, so you're trying to tilt it until those snaps simply pull away from their anchors.

(image)

At this point, the **slider thumb** and **springs** have probably launched themselves at you, so put them aside. Move the slider all the way to the left (this is the resting position for the lens mount), then pop out the **rack gear** with a flathead screwdriver or your fingers.

(image)

### 4. Outer Housing

The **outer housing** is attached to the front of the headset by a bunch of screws of all sizes.

The following image shows the location of **2x T4 screws**, **3x small Phillips head screws**, **4x large Phillips head screws** and **1x Phillips head shoulder screw**.

(image)

Of these screws, only the shoulder screw and one of the small Phillips head screws are a little tricky.

The shoulder screw is tucked away such that it is only accessible using a narrow-shaft Phillips head crossing right over the main board support. This is why replaceable-bit screwdrivers don't cut it!

(image)

The other small Phillips head is hidden behind the sliding lenses. If there isn't enough friction in the system to keep the lenses in place, you might have to hold them apart with your free hand.[^2]

Once all the screws are out, it's time to separate the outer housing from the front of the headset.

Warning! The outer housing is connected to the front of the headset by several small ribbon cables. Don't rush this part.

To initially separate the outer housing, bend the top middle of the housing up about 1/4" to allow the bracket that was holding the shoulder screw to clear the main board support.

(image?)

Pull the outer housing straight out from the front of the headset until you've got a 1/4-1/2" gap between the two. Don't pull it all the way!

Then, slowly tilt the outer housing towards the right side until it's lying flat on the work surface. There are several ribbon cables that run along the right side and will keep the outer housing tethered to the front for the moment. I suggest you find something to lay on the now-flat headband to keep the outer housing from falling over and twisting the cables.

The small PCB on the right side that terminates the ribbon cables coming from the outer housing is the breakout board. The ribbon cables are held against it with a small metal brace.

Remove the **2x small Phillips head screws** holding the brace in place.

(image)

Then, pop the ribbon cable connections off with a plastic flathead screwdriver or your fingernails. I don't suggest using a screwdriver for this step.

(image)

Now the outer housing should be free, so put it aside.

### 5. Main Board

Once the outer housing is separated, you have a lot more room to work.

First, release the **breakout board** by taking out the **2x T4 screws**.

(image)

The breakout board will flop around a bit for the rest of this step, so be careful. I've found that removing it first is ultimately easier and less dangerous to the boards.

Warning! The next step is by far the riskiest when it comes to breaking your headset unintentionally.

Once the breakout board is free, you'll want to separate the **main board** and the **main board support**. The board and its support have a tendency to flop around too once their screws are removed, so be very careful, because there is a _tiny_ plastic handle on the IPD sensor attached to the board that lodges into the right lens housing. It is _very_ easy to snap the handle off and permanently break your IPD sensor.[^3] Also, there are more ribbon cables tethering the main board to rest of the headset that you have to be careful not to break.

First, make sure the lenses are as close to each other as possible. As noted before, this is the resting position for the lens mount, so moving the lenses first will prevent any abrupt sliding that could break the IPD sensor.

Then, note that there are two plastic pegs that help align the main board support with the front of the headset.

(image)

While stabilizing the main board and its support with one hand by relying on these pegs, remove the **2x small Phillips head screws** holding it in place.

(image)

Once the screws are removed, carefully move the main board and its support straight up a little bit and then tilt it away from the headset. It's attached by two large ribbon cables that you can't yet remove.

### 6. Main Board (again) and Other PCBs

[^1]: Also, I don't like guides in video form because they're a pain in the ass to navigate as a user. That's why this one is pictures!
[^2]: In earlier teardowns I tried to remove this screw before the IPD slider, which you can do, but I found it was easier to keep track of what I was doing if I didn't split the outer housing screws across two chunks of work.
[^3]: Trust me, I did it twice.
