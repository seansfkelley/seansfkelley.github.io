---
layout: post
title: Stripping iTunes Music Store Metadata from Purchased Music
tags: reference
last_modified_at: 2024-02-17
---

When Apple announced many years ago that the iTunes Store was going DRM-free, I was ecstatic. This was during the height of DRM controversies, and it was nice to see a company with clout taking a stand against it. (It's pretty perverse to be rooting for one abusive corporation to stick it to other abusive corporations, but I guess I'll take what I can get.)

That said, iTunes still stuffs a bunch of metadata into the purchased files that it uses to, among other things, try to get you to buy other related music or hook you on Apple Music. I recently got fed up with those annoying grey stars that appear in the Music app on iOS that are, basically, telling me which songs are good and that I should be listening to them. I like listening to whole albums; don't tell me what I should like and not!

## The Fix

To fix this annoyance, I put together a script that strips all the metadata that the Music app uses to drive those features. The script requires only a little familiarity with the terminal, but there's an unfortunate amount of hoop-jumping to get both the macOS and iOS Music apps to forget the relevant metadata. They seem to cache a lot of it.

Grab [the script](/assets/stripping-itunes-metadata/strip-itunes-metadata.sh) and follow the instructions below.

## Instructions

1. Find your files.

    In the Music app, right-click > Show in Finder should suffice for any song in your library.

2. Copy the music files to a working directory anywhere else, such as your desktop.

3. Back in the Music app, delete the songs/albums.

    It will prompt you with a rather confusing dialog saying something to the effect of "you can still play these songs but they'll be deleted" and asking if you want to "hide" the songs.[^1] Yes, hide them. And yes, remove the files.

4. If you also want to make these changes on your iPhone, sync your phone now.

    It'll ask if you want to sync your purchases off your phone and back to your computer, which you should of course not do. The goal here is to remove them from the phone entirely.

5. Run the script on your files.

    ```sh
    # for instance
    path/to/strip-itunes-metadata.sh path/to/media/*.m4a
    # -> outputs stripped copies to path/to/media/stripped/

    # you can also provide the --artwork argument, since the iTunes store does not
    # embed the artwork in the file itself and you will be removing the metadata for it
    path/to/strip-itunes-metadata.sh path/to/media/*.m4a --artwork path/to/artwork.jpg
    ```

6. Add the stripped files back to the Music app.

    You probably want to make sure you have the "Copy files to Music Media folder when adding to library" option checked in preferences so you don't have to leave them lying around your desktop or wherever you stashed them.

7. And again if you're doing this on your phone too: sync your phone now.

    It should have no idea that these songs were originally purchased, and consequently will not show all the stars and copyright and "more like this please sign up for Apple Music" sections.

Done!

If you're curious to verify the files, you can use `atomicparsley <file path> -t` and it'll dump a list of all the tags.

{% include next-previous.html %}

[^1]: I guess they're trying to blur the line between what's on your local machine versus what's credited to your account. I suppose that makes sense for your average person, but I'm not a big believer in streaming services and have, on more than one occasion, been the only provider of music because there was no cell signal. Take that, Spotify!
