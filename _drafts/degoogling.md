---
layout: post
title: Extricating Myself from Google
---

Internet privacy is something I have been thinking about increasingly often over the last several years. I've been slowly working to reduce the amount of personal data I throw off as I move around the internet, but I've tried to be methodical about it because I still value some amount of convenience at the expense of privacy. But there was an elephant in the room: Google.

Fast-forward to now: I'm actively winding down my reliance on Google. In approximate chronological order:

## Search → [DuckDuckGo](https://duckduckgo.com/)

My first serious foray into intentionally avoiding Google products was to switch to DuckDuckGo. The vast majority of my searches are pretty simplistic,[^1] usually ending on Wikipedia, StackOverflow, IMDb... you get the idea. Sometimes I don't even read the titles of the result, but instead just look for a familiar logo because I know it'll be the thing I want. Even Bing would probably work most of the time.

DuckDuckGo generally isn't better or worse than Google. Google has some features I like -- such as the smaller, indented quick links under a particular result -- and one I really don't: it searches for terms it thinks I wanted and not what I asked for _all the time_. Often even when I put some of the terms in quotes, which is just obnoxious.

DuckDuckGo's quality-of-life features like the unit converters and dictionary definitions and the like are more or less fine. I could give or take the [bangs](https://duckduckgo.com/bang), but I will admit -- maybe 5% of my searches end up with me using `!g`. The irony is that in most of those cases, I end up going back to DuckDuckGo, with the `!g` serving mostly to confirm that my search terms are just bad and it's not DuckDuckGo's fault I can't find what I want.

## Chrome → [Firefox](https://firefox.com)

I've been using Firefox since 2017, from right before [they announced their major speedup](https://blog.mozilla.org/blog/2017/11/14/introducing-firefox-quantum/) which was _noticeably_ superior to the previous versions. I had abandoned Firefox many years before when Chrome was the hot new thing, because it was actually quite a bit faster and slimmer. But as Firefox clawed back performance and Chrome started to suck up all my available memory and [do creepy things](https://blog.cryptographyengineering.com/2018/09/23/why-im-leaving-chrome/) (which they later [backpedaled on](https://www.blog.google/products/chrome/product-updates-based-your-feedback/), sort of), the practical differences disappeared and it became a no-brainer to vote with my feet.

## Maps → Apple Maps

Apple Maps used to suck. It's still not as good as Google Maps, but the differences are increasingly irrelevant. They recently added [support for biking directions in California](https://www.macrumors.com/2021/04/30/apple-maps-cycling-directions-seattle-california/), which I can only assume is foreshadowing a much broader rollout once they get the necessary data. Google Maps recently added [support for crossroads](https://www.ghacks.net/2021/02/01/google-is-adding-details-such-as-crosswalks-to-google-maps/) which is... cool I guess, but affects my usage precisely zero. I think they've reached diminishing returns, which will allow Apple and others to catch up.

## YouTube → [Nebula](https://watchnebula.com/), [HBO Max](https://www.hbomax.com/) and YouTube

Okay, this one is basically impossible to get rid of. It so happens that I subscribe to a lot of channels that are also on Nebula, which I gladly pay $3/month for. For the other half of the YouTube I watch, I have a separate Google account to preclude any associating[^2] my "real" Google account with whatever I'm watching, which [Firefox Containers](https://addons.mozilla.org/en-US/firefox/addon/multi-account-containers/0) helps with a lot with. I take solace knowing that most of the non-Nebula stuff I watch is... kind of irrelevant. Just modern-day channel surfing, really.

## Gmail → [FastMail](https://fastmail.com)

This was the big one. I spend months hemming and hawing whether I wanted to uproot my entire online identity and replace it with another one. I finally did sometime in 2020,[^3] and it's been... completely fine. The world did not come crumbling down around me, though I'm still in the process of shifting accounts over to the new address. The old account will necessarily have to live forever -- it's in too many places, some of which don't allow me to change it. I also can't shake the feeling that I'm going to regret giving my new, carefully-selected forever-email-address to random companies, so I still use my Google account to sign up for less important stuff.

I decided against ProtonMail because I'm willing to trade off a lack of end-to-end encryption for the convenience of being able to use any client I want anywhere and have it just work. That is, after all, the magic of federated protocols!

## Drive, Docs, Sheets... → [Dropbox](https://dropbox.com), Apple Pages, Apple Numbers...

I don't really use these, so this was an easy transition to make.

The biggest missing thing is obviously collaboration features. I don't know what to do about that.

## The Elephant in the Room

I still use a lot of things from Apple.

{% include next-previous.html %}

[^1]: I've actually got a post on this planned for the future... I just have to collect some browsing data on myself first.
[^2]: My threat model does not include someone going to the effort to correlate things like IPs and time of access to figure out that my multiple Google accounts are actually the same physical person. I want to not be okay with that, but I think I am.
[^3]: Hey, if everything else was being turned on its head, why not add more?
