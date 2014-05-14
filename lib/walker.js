var fs = require("fs");
var path = require("path");
var dir = process.argv[2];
module.exports = list = function(directory, callback) {
    fs.readdir(directory, function(err, files) {
	files.forEach(function(file) {
	    file = path.join(directory, file)
	    fs.stat(file, function(err, stat) {
		if (! err) {
		    if (stat.isDirectory()) {
			list(file, callback);
		    } else if (stat.isFile) {
			callback(directory, file);
		    }
		} else {
		    throw err;
		}
	    });
	});
    })
}
/*
list(dir, function(directory, filename) {
    console.log(directory, filename);
});
*/