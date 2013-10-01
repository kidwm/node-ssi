
var fs = require("fs");
var assert = require("assert");

var ssi = require("../index.js");

describe("#include file", function() {
	var parser = new ssi("test/html", "/tmp/out", "");

	it("file-same should contain \"LEVEL2\"", function() {
		var filename = "test/html/level1/level2/file-same.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);
		
		assert.equal("LEVEL2\n\n", results.contents);
	});
});

