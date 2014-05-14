var fs = require("fs");
var mm = require("musicmetadata");
var path = require("path");
var async = require("async");
String.prototype.rmSlash = function () {
    if(this.substring(-1) == '/') {
        return this.substring(0, this.length - 1);
    }
    return this;
}

function mkOpts(qual, track) {
    var opts = ["--add-id3v2"];
    var map = {"artist":"--ta",
	       "title":"--tt",
	       "album":"--tl",
	       "year":"--ty",
	       "track":"--tn",
	       "genre":"--tg",
	      }
    for (var key in map) {
	if (track.metadata[key]) {
	    opts.push(map[key]);
	    switch(key) {
	    case "artist":
		opts.push(track.metadata[key][0]);
		break;
	    case "track":
		opts.push(track.metadata[key]["no"]);
		break;
	    case "genre":
		opts.push(track.metadata[key][0]);
		break;
	    default:
		opts.push(track.metadata[key]);
	    }
	}
    }
    opts.push("-");
    switch(qual) {
    case "V0":
	opts.push("-V0");
	opts.push(track.newpath);
	break;
    case "V2":
	opts.push("-V2");
	opts.push(track.newpath);
	break;
    case "320":
	opts.push("-b320");
	opts.push(track.newpath);
	break;
    }
    return opts;
}

function readFlac(directory, callback) {
    require("./lib/walker.js")(directory, function(dir, fullpath) {	
	if (path.extname(fullpath) == ".flac") {
	    var parser = new mm(fs.createReadStream(fullpath));	    
	    var track = {"filename":path.basename(fullpath),
			 "root":directory.rmSlash(),
			 "relpath":path.relative(directory, fullpath),
			 "fullpath":fullpath
			}
	    parser.on("metadata", function(metadata) {
		track.metadata = metadata;
		formats.forEach(function(format) {
		    track.newpath = path.join(track.root+"["+format+"]", track.relpath.replace(".flac", ".mp3"));
		    track.lameopts = mkOpts(format, track);
		    track.format = format;
		    callback(track);
		});


	    });
	} 
    });
}

var formats = ["V0", "V2", "320"];
var q = async.queue(require("./lib/encoder.js"), 4);
var index = 0;
readFlac(path.resolve(process.cwd(), process.argv[2]), function(track) {
    fs.writeFile(index+".json", JSON.stringify(track), function(err) {if (err) throw err;});
    index++;
});