var express = require("express");
var app = express()
var path = require("path"), 
uuid = require("node-uuid"),
fs = require("fs"),
Connection = require('ssh2'),
async = require("async");
String.prototype.rmSlash = function () {
    if(this.substr(-1) == '/') {
        return this.substr(0, this.length - 1);
    }
    return this;
}
Array.prototype.deepCopy = function() {
    var ret = [];
    for (var i = 0; i < this.length; i++) {
	ret.push(this[i]);
    }
    return ret;
}
function startSlaves(machines, callback) {
        async.each(machines, function(host, callback) {
	var c = new Connection();
	c.on('ready', function() {
	    c.exec('node ~/dev/dist-betterphp/slave.js', function(err, stream) {
		stream.on('exit', function(code, signal) {
		    console.log("Slave ("+host+") exited with code", code);
		    c.end();
		    callback();
		});
	    });
	});
	console.log("Starting slave on", host);
	c.connect({
	    host: host,
	    port: 22,
	    username: 'mifitzge',
	    password: 'something;i;can;never;have'
	});
	}, callback);
}
function readFlac(directory, callback) {
    to_encode = {};
    fs.readdir(directory, function(err, files) {
	for (var i = 0; i < files.length; i++) {
	    if (path.extname(files[i]) == ".flac") {
		var id = uuid.v4();
		var track = {"filename":files[i],
			     "id":id,
			     "root":directory.rmSlash(),
			     "fullpath":path.join(directory, files[i])
			    }
		to_encode[id] = track;
	    }
	}
	callback(to_encode);
    });
}

function run(machines) {
    
    app.formats = ["V0", "V2", "320"];
    require("./routes.js")(app);
    readFlac(process.argv[2], function(to_encode) {
	app.to_encode = to_encode;
	app.encoding = {};
	app.encoded = [];
	var server = app.listen(30005)
	startSlaves(machines, function() {
	    console.log("All jobs processed");
	    server.close();
	});
    });
}

function readMachines(callback) {
    var machines = [];
    var lazy = require("lazy");
    var rs = fs.createReadStream('machines',{encoding:"utf8"});
    rs.on("end", function() {
	callback(machines);
    });
    new lazy(rs)
     .lines
	.map(String)
	.forEach(function(line){
            machines.push(line);
	}
		);
}
function main() {
    readMachines(function(machines) {
	run(machines);
    });
}

if (require.main == module) {
    main();
}