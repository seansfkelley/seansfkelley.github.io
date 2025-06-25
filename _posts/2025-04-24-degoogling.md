---
layout: post
title: Extricating Myself from Google
anchor_headings: true
---

Internet privacy is something I have been thinking about increasingly often over the last decade, during which I've been slowly reducing my [digital footprint](https://en.wikipedia.org/wiki/Digital_footprint) (and, more aggressively, the subtly-different [digital exhaust](https://en.wikipedia.org/wiki/Data_exhaust)). The process is tedious, it's difficult to understand how well it's working, and I sometimes wonder if it's worth it, since credit bureaus and insurance companies are basically handing out your PII to hackers.

I persist because it buys me peace of mind and because I'm too principled to concede the point. I try to be somewhat pragmatic about it, and there are instances where I trade privacy for convenience. This makes Google a particularly thorny case, since I value the services they provide -- unlike Facebook, which I left years ago and often forget still exists.

This post outlines my de-Googling strategy.

## Search → [Kagi](https://kagi.com/)

Yes: I pay for my search engine. It turns out that if you drink zero cups of coffee a day, the "cheaper than a cup of coffee" marketing play works. In fact... it works better? I have a larger budget for coffee-priced things.

For a long time I used [DuckDuckGo](https://duckduckgo.com/) (and I still use it when I'm on someone else's computer or I can't be bothered to set up my Kagi account on a device), but I found the quality of the search results barely better than Google, which itself has undergone a [well-documented decline](https://www.google.com/search?q=google+search+results+are+getting+worse). Perhaps this is because they're both advertising-driven, so their incentives aren't totally aligned with their users.

Kagi, being a pay-for service, only makes money if it serves users' needs. Imagine that! They churn out features like crazy, including a _lot_ to customize your search results, as well as a bunch of random other services I couldn't really care less about. It's really lovely to be able to uprank/downrank sites.[^1]

Admittedly, the vast majority of my searches are pretty simplistic,[^2] usually ending on Wikipedia, StackOverflow, IMDb... so the bar isn't terribly high. I occasionally dip back into Google with `!g` ([bangs](https://help.kagi.com/kagi/features/bangs.html) are a feature they totally stole from DuckDuckGo), but 100% of the time I find the same bad results, so I should really stop bothering.

## Chrome → [Firefox](https://firefox.com)

It's the same. You'll be fine, trust me. Using Firefox is like driving a Saab -- a _perfectly suitable tool_ for your needs, but because it died out and nobody sees it anymore, you get looks and people assume you're weird and/or totally out of touch.

I switched to Chrome like everybody else back in the 2010s when it was the hot new thing and Firefox was dog slow, but even though Firefox itself hasn't _quite_ kept pace (though [the big change in 2017](https://blog.mozilla.org/blog/2017/11/14/introducing-firefox-quantum/) really made a huge difference), computers and connections have gotten faster so it's not noticeable in real life. What is noticeable is Chrome sucking up all my memory and [normalizing stalker-ish behavior](https://blog.cryptographyengineering.com/2018/09/23/why-im-leaving-chrome/) (which they later [backpedaled on](https://www.blog.google/products/chrome/product-updates-based-your-feedback/), sort of).

## Gmail → [Fastmail](https://fastmail.com)

This was the big one. I spent months hemming and hawing on whether I wanted to uproot my entire online identity and replace it with another one. I finally did sometime in 2020, and it's been... uneventful. The world did not come crumbling down around me, though I'm still in the process of shifting accounts over to the new address. The old account will necessarily have to live forever -- it's in too many places, some of which don't allow me to change it.

The biggest uncertainty was Fastmail's quality of spam filtering. Five years later, I can say: perfectly fine. I can recall two incidents where things I needed were erroneously flagged as spam, and one where spam made it to my inbox.

A component of my strategy here involves heavy usage of the masked email addresses. Only real people and important services (or those with KYC protocols, like banks and airlines) get a real email address. This is annoying to enforce and admittedly has not really yielded many benefits, but I'll keep doing it for peace of mind. I am legitimately surprised at how few companies seem to actually sell my masked email addresses to spammers.

I decided against [Proton Mail](https://proton.me/mail) because I'm willing to trade off a lack of end-to-end encryption for the convenience of being able to use any client I want anywhere and have it just work. That is, after all, the magic of federated protocols!

## Maps → [Apple Maps](https://maps.apple.com/)

(With apologies to non-Mac, non-iPhone users.)

Apple Maps used to suck. Like, really bad. It's improved dramatically in the years since its release, and the only things I ever return to Google Maps for are to check suspicious-looking opening hours, which are _occasionally_ wrong in Apple Maps.

This particular transition has been so successful that whenever I do end up in Google Maps, I find it an overwhelming and unpleasant place to be. The interface is laggy, packed with ads, and bombards you with buttons and completely useless location pins apparently pulled out of a hat. Why??[^3] Apple Maps is refreshingly direct and crisp, and really only shows you information you ask for.

That said: the search, um, leaves something to be desired. Thankfully, like with Kagi, my search needs are pretty basic -- find things by their name, or just the word "gas" -- so it gets the job done. Also, I don't use any of the Yelp-like or custom map/pin features of Google Maps, of which Apple Maps doesn't have a lot. I use Yelp.

## YouTube → [Nebula](https://watchnebula.com/), [Max](https://www.max.com/), [Infuse](https://firecore.com/) and [YouTube](https://youtube.com)

Okay, this one is basically impossible to get rid of. It so happens that I subscribe to a lot of channels that are also on Nebula, which I gladly pay $3/month for. I only ever watch YouTube on an Apple TV, so I gave it its own Google account to keep it away from the remains of my real one.[^4]

Thankfully, since YouTube is just glorified television, the privacy risk seems minimal. To me, it's more important to be able to pay to get rid of the ads _and_ have that pay go towards (usually) higher-quality content instead of all the clickbait garbage on YouTube.

## Drive, Docs, Sheets... → [iCloud Drive](https://www.icloud.com/iclouddrive/), Apple Pages, Apple Numbers...

(With more apologies to non-Mac, non-iPhone users.)

I barely use any of these, so this was an easy transition to make.

I have one primary computer, with backups, so I don't see much upside to keeping things on Drive. As a programmer, I use my text editor for almost all text-based work, writing maybe one "document" a year. Spreadsheets are usually one-off a couple times a year, so Numbers' mediocre (but much prettier!) reimplementation of Excel is perfectly serviceable.

I recently started using iCloud Drive for a bunch of shared documents, which was an option available to me, but I only chose it over [Dropbox](https://dropbox.com/) because Dropbox seems like a dying company and the product is really pretty ugly and clunky now.

## The Elephant in the Room

Yeah, a lot of what I did was to swap one big tech company for another.

This is a conscious decision I made as part of the convenience/privacy tradeoff. I'm unsure how honest I think Apple's apparent commitment to privacy is (though the [San Bernadino shooter incident](https://en.wikipedia.org/wiki/Apple%E2%80%93FBI_encryption_dispute) was definitely some good press for them), but since they make money off of hardware and being a services middleman, instead of advertising, it's much more believeable than the company that [retracted "don't be evil" as an unofficial slogan](https://www.snopes.com/fact-check/google-motto-dont-be-evil/).

With each passing year, the gap between competitors for the commoditized digital products that make up almost this entire list -- here meaning primarily Apple, but also sometimes-crappy open source alternatives -- closes. If I need to jump ship to OpenStreetMap, I won't be entirely happy, but it'll be a lot more usable than it was five years ago.

## You can do it too!

We're so conditioned to associate digital convenience and safety with the big names, but that's an illusion born, I suspect, from sheer ubiquity instead of any unique technical merit. I also think we're too quick to dismiss something that's 95% as good as the incumbent because one naturally wants _the best_. Do you actually use that last 5%? It is worth shipping all your data to Google so that you avoid being misled one time a year about opening hours?

It feels liberating to take back some control over this stuff. For my data to (largely) be my own, insulated from the risk of my online life being smashed underfoot as Google lumbers around locking accounts without recourse because you did one thing that makes you look like a statistical outlier.

{% include common-footer.html %}

[^1]: As of this writing, the [top 7 blocked domains](https://kagi.com/stats?stat=leaderboard) on Kagi are different flavors of Pinterest. Good to know I'm not the only one who feels this way.
[^2]: I've actually got a post on this planned for the future... I just have to collect some browsing data on myself first.
[^3]: Advertising.
[^4]: My threat model does not include someone going to the effort to correlate things like IPs and time of access to figure out that my multiple Google accounts are actually the same physical person. I want to not be okay with that, but I have to draw the line somewhere.
