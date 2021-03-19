---
layout: post
title: 'Wiping Corrupt Drives with dd: The Nuclear Option'
---

Until a couple months ago, I had never actually damaged a drive by unplugging it while it was busy. But boy, when you pull the plug at the wrong time, do things go wrong fast. I bricked a drive so completely that it would not appear in Disk Utility at all, and trying to poke at it with `diskutil` (including the full range of mount/unmount/repair/verify/partition/erase subcommands) would only ever respond with "resource busy". It was also impossible to eject and would leave zombie copies of itself around in `diskutil list`. Fun!

After some sleuthing around the internet and asking people who know more than me, I landed on the following script.

{% include alert.html
kind="danger"
title="Don't Try This at Home!"
content="Don't run this script without knowing what you're doing. If you destroy your drive/data, it's not my fault."
%}

```sh
while [ 1 ]; do
  sudo dd if=/dev/zero of=/dev/disk6 bs=1000000 count=1000
done
```

This script loops forever, writing 1000000 * 1000 = 1000000000 bytes (a gigabyte, in the true sense) of zeroes to the beginning of `/dev/disk6`. Since partition tables are located near the beginning of the disk, this will wipe them and effectively "factory reset" the drive.

To run this script, first determine what disk identifier the corrupted disk will have when you plug it in. I did this by plugging and unplugging it a few times to verify it always got assigned the same identifier (well, when it wasn't leaving zombie disks behind). Put that identifier into the script.

Run the modified script before the disk is plugged in. That'll prompt for the first `sudo`, then start looping and failing forever. Plug in the corrupted disk and wait. A successful run will be a lot quieter than the wall of errors you get while the disk isn't plugged in, and when it finishes, you can kill the script.

After running this, then unplugging and replugging the drive, Disk Utility found an empty disk and was happy to partition it for me.

A couple notes on the implementation.

`dd` is being used because the disk is unmountable and we specifically want to wipe the entire thing, partition tables included. This is a different, much harsher version of wiping a disk than what one normally does.

The disk is corrupted in a manner where the operating system is trying to mount it (or something or the sort) forever, but failing, preventing other access to the disk even though the low-level interfaces. By wrapping `dd` in an infinite loop with no wait, we can grab the disk before the operating system tries (and fails) to do anything fancy with it.

{% include next-previous.html %}

-------------------------------------------------------------------------------
