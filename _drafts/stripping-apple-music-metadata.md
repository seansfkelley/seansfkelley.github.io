---
layout: post
title: Stripping iTunes Music Store Metadata from Purchased Music
---

When Apple announced years ago that the iTunes Store was going DRM-free, I was ecstatic. This was during the height of the DRM controversy years, and it was nice to see a company with clout taking a stand against it. It's a little perversely American to be rooting for one abusive corporation to give it to another abusive corporation, but hey, I'll take what I can get.

That said, iTunes still stuffs a bunch of metadata into the purchased files that it uses to, among other things, try to get you to buy other related music or hook you on Apple Music. I recently got fed up with those annoying grey stars that appear in the Music app on iOS that are, basically, telling me which songs are good and that I should be listening to them. I like listening to albums all the way through and have exactly zero playlists: telling me how to cherry-pick the songs off the album was not okay, in my book. Especially for concept albums! Come on!

After some sleuthing on the internet, I found someone's GitHub gist that uses a couple open-source tools to strip this metadata without having to recompress the file or fiddle around with the bytes myself. Success!

## Who's This For

If you use the macOS Music app to organize your music and/or you sync your music to an iOS device for the Music app there, you're going to want to follow most or all of the instructions.

If you just have some iTunes music files that you want to strip the metadata from without the Apple Music app frills, you really only need [the script](https://gist.github.com/seansfkelley/69743345339520e75016e010a894ade7) and can skip everything else.

## Prerequisites

These instructions assume some familiarity with the terminal. Grab [this gist I forked from someone on the internet](https://gist.github.com/seansfkelley/69743345339520e75016e010a894ade7) and install the dependencies noted there.[^1] This script is where the magic happens; the rest of the instructions are just to make iOS and the Music app happy with your changes. The script is just a wrapper around libav and AtomicParsley, which do the heavy lifting.

## Caveats/Warnings

iOS seems to cache metadata and do some other optimiziations that make it kind of a pain to replace songs in your library without going through a syncing dance with your computer. The method I landed on, which might be a bit of overkill, is to remove the music from your library entirely and then re-add it. Get ready to spend some quality time shuffling files around manually.

Also, I think, but haven't verified, that when you "hide" the songs from your library, your stripped copies shouldn't compete with or duplicate the original songs, even if you have the "sync purchases from iTunes store automatically" option checked in preferences.

## Instructions

These instructions are not completely streamlined, but they get the job done.

1. Find your files. Right-click > Show in Finder should suffice for any song in your library.
2. Copy the music files anywhere else, such as your desktop.
3. Back in the Music app, delete the songs/albums. It might prompt you with a rather confusing dialog saying something to the effect of "you can still play these songs but they'll be deleted" and asking if you want to "hide" the songs.[^2] Yes, hide them. And yes, remove the files.
4. If you also want to make these changes on your iPhone: sync your phone now. It'll ask if you want to sync your purchases off your phone and back to your computer, which you should of course not do. The goal here is to remove them from the phone entirely.
5. Run the Python script on your files. It should rewrite them in-place, but don't worry, you can always redownload them from the iTunes store if you mangle them.
6. Re-add the copied files to the Music app. You probably want to make sure you have the "Copy files to Music Media folder when adding to library" option checked in preferences so you don't have to leave them lying around your desktop or wherever you cached them.
7. Your artwork is probably missing; this is because purchased music doesn't store the artwork in-file but rather in some other folder/database... somewhere. If you'd like, go get some artwork and add it to your songs.
8. And again if you're using your phone too: sync your phone now. It should have no idea that these songs were originally purchased, and consequently will not show all the stars and copyright and "more like this please sign up for Apple Music" sections.

And you're done! If you find any errors in these steps, please let me know or comment on the gist.

If you're curious to verify the files, you can use `atomicparsley <file path> -t` and it'll dump a list of all the tags.

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: I briefly considered updating this to be shell to remove the need for Python, since it's a little silly that the script halfway implements globbing and basically just shells out repeatedly, but it works and I hate writing shell, so I left it as Python.
[^2]: I guess they're trying to blur the line between what's on your local machine versus what's credited to your account. I suppose that makes sense for your average person, but I'm not a big believer in streaming services and have, on more than one occasion, been the only provider of music because there was no cell signal. Take that, Spotify!
