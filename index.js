/*jslint node: true, todo: true, vars: true, indent: 4 */

"use strict";

require('colors');

var _fs     = require('fs');
var _path   = require('path');
var ffmpeg  = require('fluent-ffmpeg');

var queue   = [];
var config  = {
    encoder    : "libx264",
    remove     : true,
    locktimeout: 24*3600,
    bitrate    : "8000k",
    haswell    : false,
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
        .videoCodec('libx264')            // Which encoding codec to use
        .videoBitrate(config.bitrate)     // Around 7500k visually the same as the source
        .videoFilters('eq=contrast=1.02') // When using Intel QSV, the contrast drops with the color profile
        .videoFilters('yadif=1')          // Deinterlace using yadif
        .audioCodec('copy')               // Make no changes/conversion to audio
        .outputOptions('-sn')             // No subtiles
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
        });

        if (config.haswell) {
            command.outputOptions(
                '-look_ahead'      , 1, // Look ahead for Haswell QSV
                '-look_ahead_depth', 10 // Look ahead depth
            );

        }

        command.run();

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
