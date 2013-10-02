
var fs = require("fs");
var assert = require("assert");

var ssi = require("../index.js");

describe("#include virtual", function() {
	var parser = new ssi("test/html", "", "");

	it("virtual-same should contain \"LEVEL2\"", function() {
		var filename = "test/html/level1/level2/virtual-same.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);
	
		assert.equal("LEVEL2\n\n", results.contents);
	});

	it("virtual-relative should contain \"LEVEL1\"", function() {
		var filename = "test/html/level1/level2/virtual-relative.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("LEVEL1\n\n", results.contents);
	});

	it("virtual-absolute should contain \"ROOT\"", function() {
		var filename = "test/html/level1/level2/virtual-absolute.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("ROOT\n\n", results.contents);
	});
});

