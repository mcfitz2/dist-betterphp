
var spawn = require("child_process").spawn;
var util = require("util");
var fs = require("fs");
var path = require("path");
var EventEmitter = require("events").EventEmitter;
module.exports = Encoder = function(track, callback) {
    console.log(track.fullpath);
    flac = spawn("flac", ["-dc", track.fullpath]);
    lame = spawn("lame", track.lameopts);
    flac.stderr.pipe(process.stdout);
//    lame.stderr.pipe(process.stdout);
    flac.stdout.pipe(lame.stdin);
    lame.on("exit", function() {
	
//	console.log(track.filename, track.format);
	callback();
    });

}
