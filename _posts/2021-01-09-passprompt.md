---
layout: post
title: "passprompt: Nag Yourself to Remember Your Passwords"
---

Recently I've been working through some security debt in my personal accounts. Most notably, until recently I didn't have a good strategy for recovering access in the case of a disaster where all my devices were lost or destroyed.

As part of my strategy/system, I decided it would be prudent to memorize more than just my master password for my password manager. However, I use long-lived login sessions for several of the most important accounts, meaning I don't have a natural opportunity to memorize their passwords.

As a password memorization aid (and to brush up on my Rust), I wrote [passprompt](https://github.com/seansfkelley/passprompt), which is a little terminal program to nag oneself to enter passwords periodically. I've configured it to run on new terminal prompts, but not more than once an hour. This way, as I naturally spend a couple hours here and a couple hours there working on my personal programming projects, I also pay down my security debt by keeping certain passwords fresh.

-------------------------------------------------------------------------------

{% include next-previous.html %}
