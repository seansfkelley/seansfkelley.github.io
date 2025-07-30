---
layout: post
title: A Primer on Sideloading Your Own iPhone Apps
---

This (brief) tutorial is for anyone with a Mac who wants to make iPhone apps for personal use[^1] but doesn't want to subject themselves to Apple's lengthy and capricious publishing process (while paying $100 for the privilege)[^2] or deal with jailbreaking.

### Caveats

- You can only do this for 3 apps at a time.
- You have to put your phone into "developer mode", which Apple describes in vaguely threatening language regarding security.
- You need to leave something running on your computer and be on the same network as it at least one a week.

Alternately, you could just move to the EU or lobby your congressperson to get off their fucking asses and do something useful instead of vomiting something about "innovation" and "small businesses" while sucking off a billionaire.

### The Actual Tutorial

1. Install [AltServer](https://altstore.io/#Downloads) on your computer and AltStore on your iPhone. [Details.](https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos)
  - You probably want to enable the AltServer > Launch at Login menu option.
  - If you can't see your phone in Finder after unplugging it, try Apple menu > Force Quit... > Finder > Relaunch.
2. Build an unsigned `.ipa` bundle using Xcode (as far as it's willing to help).
   1. Product > Archive (in Xcode 16), which should open the Xcode Organizer showing the build.
   2. Right-click the build and Show in Finder to reveal the `.xcarchive`. It's a directory, so pop it open (right-click > Show Package Contents, or just `cd`) and find the `.app` under `Products/Applications`.
   3. Pull the `.app` out and plop it in a new empty directory somewhere called `Payload`.
   4. `zip -r <app>.ipa Payload` to finish the unsigned bundle.
3. Get the `.ipa` onto your phone somehow.
   - Apple makes this really fucking annoying to do through the Files app,[^3] so I just used my Dropbox. iCloud Drive (and other similar things) probably also work.
4. In AltStore, go to My Apps > + > navigate to the `.ipa`.
   - Note that it starts you down a directory -- hit the back button to see other file systems.

That should be it! You can test the wireless refreshing by tapping "7 Days" in the newly-installed app listing.

{% include common-footer.html %}

[^1]: You can do this trivially in stock Xcode... for 7 days at a time. We grovel at your feet for your magnanimity, oh Grand High Beancounter Tim Cook.
[^2]: Short version of my stance on app store gatekeeping, since I can't resist: Apple can and should provide an official distribution channel with tight rules _in addition to_ allowing other app stores and drag-and-drop app installation. There is merit in walled gardens, but the 30% fee (or [27%](https://www.axios.com/2025/05/01/apple-epic-lawsuit-app-store-offsite-fees), yeah, fuck you too, Tim Cook) in absence of competition is (literally) extortionate, their "reviews" seem to let plenty of scams and low-quality garbage through anyway, and these policies stifle small-time operators.[^4]
[^3]: I would feel stupid that I can't figure out how to just... move a file onto my iPhone, but I'm pretty sure this is Apple being purposely obstructive. The Files tab in Finder can only drop files into apps that register themselves as file-using, rather than the general Files area. AirDropping an `.ipa` is a black hole, I guess either because it's a blacklisted file type or it's not a whitelisted file type.
[^4]: I finally finished an iOS app on the third try in as many years, but I almost gave up again on the way there. The blame for _every_ nontrivial frustration and roadblock is laid squarely at the feet of Xcode or the App Store -- _never_ the iPhone itself, the iPhone SDK, or Swift/SwiftUI.
