ts2mkv
=============

ts2mkv is a small utility that converts transport streams (.ts files) that are recorded by, but not limited to, Ziggo Humax recorders to MKV files. It does this by wrapping handbrake, a video converting utitlty.

Goal
---

The goal is to provide a 40% (or thereabouts) size reduction of the recordings and the ability to cut and edit the video, since transport streams don't allow for easy editing without affecting the transport stream's integrity.

How it works
---
ts2mkv will scan the folder and choose a .ts file to start converting. It'll place a .lock file to indicate that it is busy, so any other instances of the program won't interfere; instances that are running on other computers for example.

Usage
---

Usage is easy: configure ts2kv using a config file, name the file *config.js* (required) and specify options like this:

```
{
	"dirs":["/directory/to/the/ts/files"]
}
```
This file gets parsed and merged with de defaults configuration.

Then just start ts2mkv like this:

```
node index.js
```

Default configuration
---
```
var config  = {
    encoder    : "x264",
    locktimeout: 24*3600,
    dirs       : []
};
```



Options
---

#### `encoder` (string)
This is the encoder that is used by Handbrake. [Click here for a list of supported encoders.](https://trac.handbrake.fr/wiki/Encoders#Video)

#### `locktimeout` (integer)
This option specifies the time (in seconds) that a lock is valid. If the time at which the file was locked is longer than ```locktimeout``` seconds ago, the lock is lifted (file deleted).

#### `dirs` (array of string)
An array of directories that will have their .ts files converted

Todo
----
- Monitoring of directories, so new files automatically get converted...