var fs = require("fs");
var path = require("path");

module.exports = function(app) {
    app.get("/fetch", function(req, res) {
	if (Object.keys(app.to_encode).length > 0) {
	    var track = app.to_encode[Object.keys(app.to_encode)[0]];
	    //	    console.log(track.id, formats);
	    res.header("X-ID", track.id);
	    res.setHeader("X-Format", app.formats);
	    //	    console.log(track);
	    fs.createReadStream(track.fullpath).pipe(res);
	    track.formats = app.formats.deepCopy();
	    app.encoding[track.id] = track;
	    delete app.to_encode[track.id];
	    //	console.log(Object.keys(to_encode));
	} else {
	    res.send(404);
	}
    });
    app.put("/upload", function(req, res) {
	var id = req.headers["x-id"];
	var format = req.headers["x-format"];
	if (app.encoding[id]) {
	    if (app.encoding[id].formats.length > 0) {
		app.encoding[id].formats.splice(app.encoding[id].formats.indexOf(format), 1);
		//change this line to place the file in the correct directory
		var filename = path.join(app.encoding[id].root+"["+format+"]", app.encoding[id].filename.substring(0, app.encoding[id].filename.length-5) + "["+format+"].mp3");
		function done() {
		    console.log("Saving to...", filename);
		    req.pipe(fs.createWriteStream(filename));
		    req.on("end", function() {
			res.send(200);
		    });
		}
		fs.exists(app.encoding[id].root+"["+format+"]", function(exists) {
		    if (! exists) {
			fs.mkdir(app.encoding[id].root+"["+format+"]", function(err) {
			    done();
			});
		    } else {
			done();
		    }
		});
		
	    } else {
		res.send(500);
	    }
	    
	} else {
	    res.send(500);
	}
	
	
    });
}