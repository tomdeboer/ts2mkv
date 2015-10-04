/*jslint node: true, todo: true, vars: true, indent: 4 */

require('colors');

var _fs     = require('fs');
var _path   = require('path');
var _hbjs   = require("handbrake-js");

var dir = process.argv[2] + "/";
var queue = [];

function _fileexists(filepath) {
    try {
        return !!_fs.statSync(filepath);
    } catch (err) {
        return false;
    }
}

if (!_fileexists(dir)) {
    console.log(("Invalid dir: " + dir + ". Usage: node index.js /path/to/ziggo").red);
    process.exit(1);
}

function convert(filepath, fn) {
    fn = fn || function () { console.log(arguments); };

    console.log("Converting:".blue.bold, filepath);
    try {
        // Init some file information
        var filepaths = _path.parse(filepath);
        // var fileinfo  = _fs.statSync(filepath);
        var filelock  = _path.join(filepaths.dir, filepaths.name + '.lock');

        // "Lock" the file
        if (_fileexists(filelock)) {
            console.error(" > File is locked: skipping it".yellow);
            fn(new Error("File is locked"));
            return;
        }

        _fs.writeFileSync(filelock, (+new Date()));
        console.log(" > File now locked".grey);

        var tsfile  = filepath;
        var mkvfile = _path.join(filepaths.dir, filepaths.name + '.mkv');

        _hbjs.spawn({
            aencoder: "copy:ac3",
            modulus: 4,
            decomb: "bob",
            encoder: "x264",
            quality: 20,
            // "use-opencl": "",
            // "use-hwd": "",
            input: tsfile,
            output: mkvfile
        })
            .on("begin", function () {
                console.log(" > Starting encoding...".grey);
            })
            .on("error", function (err) {
                console.error(" > Handbrake error: %s".red, err);
            })
            .on("progress", function (progress) {
                console.log(" > status: %s, ETA: %s @ %s fps".grey, progress.percentComplete, progress.eta, progress.fps);
            })
            .on("end", function () {
                console.log(" > Conversion sucess!".green);
                _fs.unlink(tsfile);
            })
            .on("complete", function () {
                _fs.unlink(filelock);
                console.log(" > Conversation complete...".grey);
                fn(null);
            });

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
    convert(filepath, start);
}

_fs.readdirSync(dir).forEach(function (filename) {
    if (!/\.ts$/.test(filename)) {
        return;
    }
    var path = dir + filename;
    queue.push(path);
});

start();
