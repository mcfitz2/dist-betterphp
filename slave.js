var request = require("request");
var fs = require("fs");

var encoder = require("./lib/encoder.js");
var server = "http://silo.cs.indiana.edu:30005";
function fetchEncode() {
    var req = request.get(server+"/fetch");
    req.on("end", function() {
	if (req.response.statusCode != 200) {
	    switch(req.response.statusCode) {
	    case 404:
		console.log("No jobs!");
		break;
	    }
	    return;
	}
	var id = req.response.headers["x-id"];
	var e = new encoder(id+".flac", req.response.headers["x-format"].split(", "));
	e.on("encoded", function(encoder) {
	    var rs = fs.createReadStream(encoder.filename);
	    rs.on("end", function() {
		fs.unlink(encoder.filename, function(err) {
		    if (err) console.log(err);
		});
	
	    });
	    rs.pipe(request.put({
		"url":server+"/upload", 
		"headers":{"X-ID":id, "X-Format":encoder.qual}
	    }));
	});
	e.on("finished", function(info) {
	    fs.unlink(info.input, function(err) {
		if (err) console.log(err);
	    });
//	    console.log("Finished");
	    if (req.response.statusCode == 200) {
		console.log("Going around again!");
		fetchEncode();
	    }
	});
    });
    
    req.on("response", function(response) {
	req.pipe(fs.createWriteStream(response.headers["x-id"]+".flac"));  
    });
}
fetchEncode();