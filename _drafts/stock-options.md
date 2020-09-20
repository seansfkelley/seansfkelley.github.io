---
layout: post
title: What is the Point of ISOs?
---

I recently had a talk with a CPA and finally got an explanation of ISOs and NSOs that made sense to me as a layman. I've more or less understood the mechanics of stock options and their taxation for a while, but I've only dimly understood what the tax rules were trying to communicate underneath all the legalese.

This is my attempt at translating the intent behind ISOs into a human-readable format. I've left out many subtleties and specifics, but there are far more than enough places to get that elsewhere on the internet. The goal of this post is to provide an intuition for what the IRS is trying to do with ISOs and why some of the tax rules that implement ISOs are the way that they are.

## Disclaimer

This is the internet, so I have to say: I am not a tax advisor. This is not tax advice. I am not a lawyer. This is not legal advice. (Could it even be construed as legal advice?) I am not a doctor. This is not medical advice. (Though if you figure out a workable interpretation as medical advice, I would be curious to hear it.)

Also, check the updated date of this post above; the laws may have changed since this was written (and please tell me if so!).

Now let's get on with it.

## First, Some Background

This post is not really a primer, in that I'm going to assume you have at least vague familiarity with things like "strike price" and "long term capital gains" and the mechanics of working with stock options. If you don't, this post might still make sense, though you may need to supplement it with a list of definitions or just [throw yourself into the legalese](https://www.irs.gov/taxtopics/tc427).

As a simplifying assumption, we're going to say that the stock price goes up between grant, exercise and sale. If it doesn't, you're either not going to exercise/sell anyway, or you going to do some kind of loss-harvesting shenanigans, which are above my pay grade.

Lastly, a note on verbiage: I've used "ISO" and "NSO" to mean both the option itself as well as the stock that results from exercising the option. It should be clear from context whether or not the actual thing under discussion is an option or a stock, and I figured that sprinkling "ISO-derived stock" all over the post would be more noisy than helpful.

## Starting with NSOs

To explain ISOs, the best place to start is NSOs. For our purposes, NSOs are the default case of a stock option[^1] to which ISOs add some complexity.

When buying and selling NSOs and the resultant stock, there are three payments you have to make:

1. strike price
2. tax at exercise
3. tax at sale

The **strike price** is your discounted purchase price for the stock. Pretty straightforward; that's the whole point of the option.

The **tax at exercise** is tax you pay on the difference between the strike price and the current market value[^2] (the "bargain element") of the stock. Specifically, this is regular income tax (and can raise your income tax bracket like it, too). The idea here is that if you have a strike price of $1 for an option on a stock that's trading at $3, that difference is just as good as cash: you could just turn around and sell it on the market and net a cool $2.

The **tax at sale** varies, and in both cases is taxed as capital gains, either short term or long term. Short term becomes long term at the one-year mark; if you sell a stock less than a year after you exercised the option for it, you get a worse tax rate.[^3] Short term capital gains is currently (and generally) taxed as if it's ordinary income; long term capital gains is much lower. Short term capital gains can _also_ raise your income tax bracket.

When exercising NSOs, the strike price and tax are bundled up in a single payment, and the tax is done by withholding at a rate that is really a best-guess more than an accurate estimate.[^4]

In summary: exercising NSOs is a way to get a bit of stock without paying the market rate, but still paying hefty taxes on the discount that you got. Once you have the stock, it's no different than if you'd bought it in the public market.

## On to ISOs!

ISOs do a weird sort of speculative taxation-ahead-of-time thing which is why it took me so long to wrap my head around it.

The first imporatnt difference between an ISO and an NSO is that an ISO _doesn't behave like an ISO unless certain conditions are met_.[^5] Specifically, you must hold it:

- more than a year after exercise
- more than two years after grant

If you don't, it's instead taxed as an NSO. Put another way: you _must_ pursue the long term capital gains route with an ISO if you want any tax advantage from it at all. And then there's the grant date restriction on top of that.

The speculative behavior of ISO taxation stems from the desire of the IRS to tax you at exercise, before either you or they know whether it's ultimately supposed to be taxed as an ISO or an NSO. So they "guess" at a reasonable tax rate but acknowledge that it's yet to be determined, waiting for the sale, at which point the speculative taxes will be cleaned up to match whatever it was supposed to be.

Here we have to introduce the Alternative Minimum Tax. The AMT is an incredible hack: when the IRS discovered all kinds of fun loopholes in the tax code, the closed them by inventing a whole _new_ tax code, and then hiding it as just a couple lines inside the normal tax code. It's kind of like you followed a footnote on this post, and the footnote was a whole other tangential-but-related post on its own.[^6]

When you exercise an ISO, it doesn't count for regular income like an NSO and no withholding is done. Instead, it counts as AMT income: bizarro-world income that you don't actually have yet and couldn't turn into real money for at least another year, because if you tried the stock would actually be NSOs, and the AMT would not apply.[^7] If you exercise enough ISOs, your AMT tax gets larger than your ordinary income tax, and you end up paying it instead!

So what happens when you sell?

### Scenario 1: Sell Too Early

If you end up selling the ISO too early and don't meet the conditions, the stock is treated as an NSO, the dust settles, taxes are calculated, AMTs are credited, and the end result is that you pay tax as if it was an NSO all along.

Or at least, I'm pretty sure that's what happens: it can be a little hard to sift through the noise, since the actual implementation of this idea involves getting some refunds here but having to pay more there: lots of shuffling dollars around to make the math work out and have the right numbers in the right place for classification purposes.

### Scenario 2: Wait Long Enough

If you wait to meet the ISO conditions and then sell, you pay long term capital gains on the _difference between the strike price and the sale price_ while getting an AMT refund.

**This is where the magic happens.** Let's break it down a little more.

Remember than an NSO was taxed first at exercise on `market value at exercise - strike price` and then at sale as `sale price - market value at exercise`. Adding those together, you get exactly `sale price - strike price`, which is what the ISO is ultimately taxed based on.

So, while an NSO can capture the preferential long term capital gains rate on the only on the second gain (from exercise to sale), an ISO can capture it for the _entire_ gain you realized: from strike to sale.

At this point, the dust settles, and like the first scenario, money is refunded from here (like the AMT) and instead paid to there. The end result is that you pay tax as if everyone knew it was going to be an ISO all along.

## Summary

Exercising ISOs triggers a speculative taxation before anyone knows if the stock will ultimately be classed as an ISO or an NSO. When you sell the stock, taxes are cleaned up after the fact to make them consistent with whichever form the stock ended up in: ISO or NSO. The key difference between ISOs and NSOs -- given the same timeline of grant/exercise/sale and prices, and assuming the ISO conditions are met -- is that ISOs will apply the lower tax rate of long term capital gains to a chunk of gains that NSOs use the higher income tax rate for.

And of course, there is a _whole lot_ of tweaking you can do around the timing and margins to squeeze out extra value, which is why you hire a tax professional.

{% include next-previous.html %}

-------------------------------------------------------------------------------

[^1]: I don't have any familiarity with employee stock purchase plans, which, according to the IRS, are the third category of stock options.
[^2]: For private companies, substitute the 409A-defined fair market value instead of the public market price.
[^3]: This is no different than many other assets, which are also subject to capital gains. The point of capital gains taxes is to reward risk: if you hold an asset for a long time, you're betting that it'll go up and risking that it doesn't. And that's all it really is: betting. If you're right, you get a reward.
[^4]: 22% or 37%, depending, as of this writing. Don't forget to make estimated tax payments to correct for the difference. I'm a little fuzzy on this, but I think if you're way off on your withholdings for the year you can get slapped with a penalty (as distinct from a debt) when you go to file your taxes in April. Or maybe that's just when the AMT is involved? Ask a CPA.
[^5]: Something that drove me crazy that I have come to accept is that you are responsible for managing all these important conditions and dates. Nobody is going to track the complete lifetime of an ISO for you; nobody is going to tell you if you do something wrong and your ISO was actually taxed like an NSO until the dust settles next April and you find out you did it wrong last year. Whoops.
[^6]: Not this footnote, though.
[^7]: In an earlier draft of this post I took this paradox to heart and tried to explain ISOs with time travel. Not a great idea.
