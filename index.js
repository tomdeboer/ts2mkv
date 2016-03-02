/*jslint node: true, todo: true, vars: true, indent: 4 */

"use strict";

require('colors');

var _fs     = require('fs');
var _path   = require('path');
var ffmpeg  = require('fluent-ffmpeg');

var queue   = [];
var config  = {
    encoder    : "x264",
    remove     : true,
    locktimeout: 24*3600,
    bitrate    : "8000k",
    dirs       : []
};

function _fileexists(filepath) {
    try {
        return !!_fs.statSync(filepath);
    } catch (err) {
        return false;
    }
}
function convert(filepath, fn) {
    fn = fn || function () { console.log(arguments); };

    console.log("Converting:".blue.bold, filepath);
    try {
        // Init some file information
        var filepaths = _path.parse(filepath);
        // var fileinfo  = _fs.statSync(filepath);
        var filelock  = _path.join(filepaths.dir, filepaths.name + '.lock');

        var timestamp = Math.floor(new Date()/1000);

        // "Lock" the file
        if (_fileexists(filelock)) {
            if (timestamp - _fs.readFileSync(filelock) < config.locktimeout){
                console.error(" > File is locked: skipping it".yellow);
                fn(new Error("File is locked"));
                return;
            }

            console.log(" > lock file found, but it has expired. Deleting lock file and continuing...".grey);
        }

        _fs.writeFileSync(filelock, timestamp);
        console.log(" > File now locked".grey);

        var tsfile  = filepath;
        var mkvfile = _path.join(filepaths.dir, filepaths.name + '.mkv');

        var command = ffmpeg(tsfile)
        .videoCodec('libx264')
        .videoBitrate(config.bitrate)
        .videoFilters('eq=contrast=1.02')
        .duration(10)
        .audioCodec('copy')
        .outputOptions(
            '-sn'           // No subtiles
        )
        .output(mkvfile)
        
        .on('start', function(commandLine) {
            console.log('Spawned ffmpeg with command:'.grey, commandLine);
        })
        .on('progress', function(progress) {
            console.log('Processing:'.grey, progress);
        })
        .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: '.red.bold, err.message);
        })
        .on('end', function() {
            console.log(" > Conversion finished".green.bold);
            _fs.unlink(filelock);
            if (config.remove) {
                _fs.unlink(tsfile);
            }
            fn(null);
        })

        .run();
        



        // _hbjs.spawn({
        //     aencoder: "copy:ac3",
        //     modulus: 4,
        //     decomb: "bob",
        //     encoder: config.encoder || "x264",
        //     quality: 20,
        //     // "use-opencl": "",
        //     // "use-hwd": "",
        //     input: tsfile,
        //     output: mkvfile
        // })
        //     .on("begin", function () {
        //         console.log(" > Starting encoding...".grey);
        //     })
        //     .on("error", function (err) {
        //         console.error(" > Handbrake error: %s".red, err);
        //     })
        //     .on("progress", function (progress) {
        //         console.log(" > status: %s, ETA: %s @ %s fps".grey, progress.percentComplete, progress.eta, progress.fps);
        //     })
        //     .on("end", function () {
        //         console.log(" > Conversion sucess!".green);
        //         if (config.remove) {
        //             _fs.unlink(tsfile);
        //         }
        //     })
        //     .on("complete", function () {
        //         _fs.unlink(filelock);
        //         console.log(" > Conversation complete...".grey);
        //         fn(null);
        //     });

    } catch (err) {
        console.error(" > %s".red, err);
        fn(err);
    }
}
function start() {
    if (queue.length < 1) {
        console.log("Queue is empty :)".green);
        return;
    }

    var filepath = queue.pop();
    convert(filepath, function (err) {
        setImmediate(start);
    });
}


try {
    // Load user config
    require('util')._extend(config, JSON.parse(_fs.readFileSync('config.json')));
    console.log("config.json read...".green);
} catch (err) {
    console.log(("Warning: could not read/parse config.json!:\n" + err).yellow);
}

if (config.dirs.length < 1){
    console.log("Nothing to do: no directories specified in config...".red);
    return 1;
}
config.dirs.forEach(function (dir){
    dir = dir + "/";

    if (!_fileexists(dir)) {
        console.log(("Invalid dir: " + dir + ". Usage: node index.js /path/to/ziggo").red);
        return;
    }


    _fs.readdirSync(dir).forEach(function (filename) {
        if (!/\.ts$/.test(filename)) {
            return;
        }
        var path = dir + filename;
        queue.push(path);
    });
});

start();
