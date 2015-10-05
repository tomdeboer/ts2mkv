ts2mkv
=============

ts2mkv is a small utility that converts transport streams (.ts files) that are recorded by, but not limited to, Ziggo Humax recorders to MKV files. It does this by wrapping handbrake, a video converting utitlty.

Goal
---

The goal is to provide a 40% (or thereabouts) size reduction of the recordings and the ability to cut and edit the video, since transport streams don't allow for easy editing without affecting the transport stream's integrity.

How it works
---
ts2mkv will scan the folder and choose a .ts file to start converting. It'll place a .lock file to indicate that it is busy, so any other instances of the program won't interfere; instances that are running on other computers/clusters for example.

Usage
---

Usage is easy. At this point you can rung the conversion on a full directory by running:

```node index.js /path/to/recording```
