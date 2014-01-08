
var spawn = require("child_process").spawn;
var mm = require('musicmetadata');
var util = require("util");
var fs = require("fs");
var path = require("path");
var EventEmitter = require("events").EventEmitter;
var formatMap = ["V0", "V2", "320"];

function mkOpts(qual, metadata, id) {
    var opts = ["--add-id3v2"];
    var map = {"artist":"--ta",
	       "title":"--tt",
	       "album":"--tl",
	       "year":"--ty",
	       "track":"--tn",
	       "genre":"--tg",
	      }
    for (var key in map) {
	if (metadata[key]) {
	    opts.push(map[key]);
	    switch(key) {
	    case "artist":
		opts.push(metadata[key][0]);
		break;
	    case "track":
		opts.push(metadata[key]["no"]);
		break;
	    case "genre":
		opts.push(metadata[key][0]);
		break;
	    default:
		opts.push(metadata[key]);
	    }
	}
    }
    opts.push("-");
    switch(qual) {
    case "V0":
	opts.push("-V0");
	opts.push(id+"[V0].mp3");
	break;
    case "V2":
	opts.push("-V2");
	opts.push(id+"[V2].mp3");
	break;
    case "320":
	opts.push("-b320");
	opts.push(id+"[320].mp3");
	break;
    }
    return opts;
}

module.exports = multiEncoder = function(input, formats) {
    dirname = path.dirname(input);
    basename = path.basename(input, path.extname(input)); //TODO support files not in base directory
    flac = spawn("flac", ["-dc", "-"]);
    encoders = [];
    ended = 0;
    var parser = new mm(fs.createReadStream(input));
    var self = this;
    parser.on("metadata", function(result) {
	for (var i = 0; i < formats.length; i++) {
//	    console.log("Encdng", basename, "at qual=", formats[i], "i=", i, formats);
	    encoders.push({qual:formats[i], metadata:result, filename:basename+"["+formats[i]+"].mp3", basename:basename, process:spawn("lame", mkOpts(formats[i], result, basename))});
	  //  encoders[i].process.stderr.pipe(process.stdout);
	    encoders[i].process.stdout.on("end", function() {
		ended++;
		if (ended == encoders.length) {
		    self.emit("finished", {input:input});
		    for (var k = 0; k < encoders.length; k++) {
			self.emit("encoded", encoders[k]);
		    }
		}
	    });
	}
	//flac.stderr.pipe(process.stdout);
	flac.stdout.on("data", function(chunk) {
	    for (var i = 0; i < encoders.length; i++) {
		encoders[i].process.stdin.write(chunk);
	    }
	});
	flac.stdout.on("end", function() {
	    for (var i = 0; i < encoders.length; i++) {
		encoders[i].process.stdin.end();
	    }
	});
	fs.createReadStream(input).pipe(flac.stdin);
	
    });
}
util.inherits(multiEncoder, EventEmitter);

if (require.main == module) {
    var me = new multiEncoder(process.argv[2], [0,1,2]);
    me.on("encoded", function(encoder) {
	console.log(encoder.filename);
    });
}