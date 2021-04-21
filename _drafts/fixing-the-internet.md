---
layout: post
title: A Theory on Regulating Social Media
---

Social media has been on poeples' minds increasingly often these last few years. Regardless of where you stand on Twitter moderation, or the relative lack thereof on Facebook, or the continued existence of Parler, surely you agree that _something_ is broken. It appears that nobody is happy with the way things are working except those who stand to make money from it.[^1]

While I am relieved to never again have to hear about Twitter as the mouthpiece of a sitting president[^2], my first thought after the banhammer came down in January 2021 is [nicely summarized by the ACLU](https://www.aclu.org/podcast/what-does-free-speech-mean-online-ep-139)[^3], which I have excerpted here:

> We understand the desire to permanently suspend him now, but it should concern everyone when companies like Facebook and Twitter wield the unchecked power to remove people from platforms that have become indispensable for the speech of billions...  President Trump can turn to his press team or Fox News to communicate with the public, but others... will not have that luxury.

What's really concerning is not so much that "Facebook and Twitter wield the unchecked power to remove people from [their] platforms" as it is that Facebook and Twitter are considered "platforms that have become indispensable for the speech of billions". It's concerning for two reasons.

The first reason is that we should never find ourselves in a situation where a for-profit company is the conduit through which billions exercise their fundamental rights. This seems like a self-evident thing to say -- after all, such companies' primary goal is money, not your rights -- but in case it's not, there is a long list of domains where a lack of sufficiently aggressive regulation has led to companies abusing the populace: Flint's water problems, ERCOT's unwillingness to prepare for cold weather, the entire healthcare system (remember pre-existing conditions?), Intuit lobbying for more difficult taxes, for-profit prisons being paid by the prisoner... the list goes on.

-------------------------------------------------------------------------------

Notably, none of these examples cover rights enumerated in the Constitution,[^4] but that hasn't historically stopped the government from intervening for the sake of the consumer. Does anybody regret breaking up AT&T or Standard Oil? Why are most utility companies public-prviate? Libertarians nonwithstanding, it seems like if we agree that the unenumerated right of clean drinking water is too important to be left (only) in the hands of private companies, that free speech should be equally unencumbered by predatory capitalism is a no-brainer, especially because the Constitution explicitly bars government tampering (unlike in the case of clean drinking water).

It shouldn't need repeating, but I think I will anyway: Facebook and Twitter are not (currently[^5]) beholden to _anybody_ except their shareholders. That Twitter comes off as the more ban-happy and left-leaning of the two is not out of the goodness of Jack Dorsey's heart in wanting to promote civil discourse, but rather that he and other Twitter executives have calculated that taking such actions makes them look good among their target demographics (both user and advertiser), and that keeps the gravy train chugging. Not to mention that the First Amendment doesn't apply to them, as everybody keeps trying to tell the flag-waving loonies that Facebook bans.

The second reason, which is the more provocative of the two and the one that I will focus on for the rest of this post, is that we should not consider the forum these companies provide to be so useful as to be considered "indispensible". Beyond the [well-documented harm these companies facilitate](https://www.bbc.com/news/world-asia-46105934) and turn a blind eye to, they also don't seem to provide a service sufficiently unique to justify their downsides, even if you buy into [Facebook's naive notion that more interpersonal connectivity is inherently, objectively good](https://www.buzzfeednews.com/article/ryanmac/growth-at-any-cost-top-facebook-executive-defended-data#.eeggDmkA3) and everything would be solved if people would just talk.

So why would Facebook be considered indispensible to your average user? (I'll be focusing on Facebook for much of the remainder of this post; it's more featureful and has a larger user base than any other social network, especially when you include WhatsApp and Instagram.)

Centralization.

Centralization has two aspects when considering Facebook: the **centralization of features** -- contact lists, messaging, calendars and media/tagging are all tightly integrated -- and the **centralization of an audience** -- enabling authors to broadcast to billions of potential readers, or, enabling readers to discover and choose among millions of authors.

The centralization of features (while I'll call "integration" from now on) is secondary to the centralization of an audience, which is another name for the [network effect](https://en.wikipedia.org/wiki/Network_effect). This is obvious if you compare Facebook to Twitter: Twitter has far fewer features and interacts with fewer aspects of one's life, yet has a comparably large community finding value in it all the same. Even social networks with restrictive gimmicks like Snapchat and TikTok do just fine, as long as they've attracted enough users.

-------------------------------------------------------------------------------

There's a broader trend on the internet nowadays towards centralization. Centralization is not inherently a bad thing, though it should be noted that decentralization was a core founding principle of the internet, and why it's able to self-heal from outages or problems, routine or sudden, localized or not, malicious or accidental, physical or social.

TODO ^^^

Do I want to get into a long thing about Tim Berners-Lee and the semantic web, or keep talking about how to recreate social media from its constituent parts?

Hate groups and public shaming spin out of control when you can self-promote. Classical centralization -- radio, TV, newspapers -- and decentralization make that more difficult. We should try to get the best of both.

-------------------------------------------------------------------------------

_"...platforms that have become indispensable for the speech of billions"._ To be beholden to the whims of a for-profit company for access to a wide audience is a concerning thought. Or rather, it sounds like it is, but it's been generally accepted as both unavaoidable and reasonable for hundreds of years in the form of newspapers, radio, and television.

The real underlying problem with social media as it pertains to this type of speech is that we, the general public and users, have a historically unaware and unreasonable opinion on how this type of speech ought to work. Put another way: _why do we think we have the right to instantaneously publish our thoughts to potentially billions of others?_ There is no precedent for that, nor is it self-evidently good or useful. Why is Twitter "indispensable"?

// TODO: Put in an argument for why the following system should exist.

The internet is a fractal hodge-podge. At every level, in every (sub)system, physically, digitally, legally, it's just a bunch of things that seem to work mashed up into an incredible and surprisingly robust whole.

Legally speaking, regulation is all over the place. The FCC of late has been swingly violently from one side of the aisle to the other, GDPR and the CCPA are trying to control at least some emergent behaviors, and social media is a modern Wild West. There's no holistic approach handling which systems exist, why, and what their role is.

My proposal focuses on three main tiers and has some corollary observations afterwards. Something something about this being only about producers of content.

1. **Access.** Access to the internet should always be available. More specifically:

    - ISPs cannot be held liable for the bytes that travel their network, and furthermore, they should not be allowed to discriminate those bytes. Net neutrality, for short. // TODO: Look up the more specific definition of net neutrality and mmake sure I'm not underselling it.
    - Domain registrars should not be held liable for the content of the domains registered with them.
    - Some domain registrars should not be allowed to discriminate against registrants based on the content of the site they host. Call these the "public" registrars.
    - Some domain registrars can disallow certain registrants, but only on the grounds of value-neutral judgements, as they currently do, such by nationality or area of focus. Call these the "private" registrars.

  This is all that I consider mandatory to allow producing content on the internet. If you want to product a hate site, you can, with these rules, but you have to do the rest of the work yourself: buy a physical server, set up we hosting software, pay bandwidth bills.

2. **Hosting.** Hosting companies like AWS cannot be held liable for the content that they host. However, they _are_ allowed to discriminate against that content. Usually, this is called "terms of service".

  This is all that I consider necessary for someone to start politically-neutral web sites, which are the vast majority on the internet: ecommerce, blogs, forums, etc.

3. **Publishing.** Publishing content is defined as "allowing any old schmuck to blast their opinions out to the wider internet with as little as keyboard and couple clicks". Publishers are legally liable for the content on their network in the same way that traditional media publishers are.

The idea here is that you have a right to be able to produce content on the internet, but you do _not_ have a right to a wide audience. That is a privilege that for-profit companies may provide.

// TODO: Include some thoughts on public access domains/hosting/etc.

// TODO: Talk also about anonimity: are you allowed tobe anonymous if you use a public registrar?

// TODO: Talk about private 1:1 messages (not publishing).

"self-evidently good or useful": how about an aside on Facebook thinking that connecting the world is objectively a good and correct thing to do?

compare to traditional media: TV has public access channels, newspaper have editorials, but you don't have a right to blast your opinion to everyone, which is the problem with the internet now

outline

- stumbleupon
- free domains regulated by the government a la public access TV
- no/limited search engines
- social media only for "friends" (you aren't allowed to publish to billions of people)
- private hosts can do whatever
- public hosts of others' content are regulated like publishers

what are the things that make the internet great?

- low barrier to entry
-

With the tide slowly turning against Facebook (and, to lesser degrees, Google and Twitter), I've started to reflect on how I use the internet, what I do and don't value about it, and how to prevent some of the bad tendencies we've started to see.

I'm not an expert on social systems and communities by any means, just someone with an interest in an internet that serves people more than corporations and nation-states. Furthermore, I didn't want to be constrained by existing legal systems and decisions, only by technical ones. In that way, this might be a little impractical to achieve in any short time frame, or at all.

Many of the ideas here grew out of a train of thought focusing on regulating social media companies. I'm not intimately familiar with Section 230 and indeed, for better or for worse, I'm going to more or less ignore it except as it provides explanatory power.

The basic argument was as follows:

- social media companies exercise direct and strong control over what content reaches users -- ranking algorithms, suggested content and at times, censorship

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: Ah, the way of the world.
[^2]: Time will tell, but one can hope.
[^3]: The ACLU has a history of defending rights regardless of ideology -- a [press release in 2012](https://www.aclu.org/press-releases/aclu-em-defends-kkks-right-free-speech) advertises that they defended the First Amendment rights of the KKK -- and that's reflected in this quote as well. This type of across-the-board defense of civil rights is appealing for its consistency, and lends the ACLU quite a lot of credibility when it takes positions on these cases. Indeed, the [ACLU's page on freedom of expression](https://www.aclu.org/other/freedom-expression) outlines their position nicely, and even has some illuminating clarifications, such as explaining why requiring permits for demonstrations is legal under the First Amendment.
[^4]: The Constitution is focused on higher ideals than potable water, and I haven't yet formed an opinion on whether I think it should have been a little more precise on some of the more practical issues.
[^5]: Foreshadowing!

