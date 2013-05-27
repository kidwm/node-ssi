
var assert = require("assert");
var ssi = require("../index.js");

function buildIncludeFile(file) {
	return "<!--#include file=\"" + file + "\" -->";
}

describe("#include file", function() {
	var parser = new ssi("test/html", "/tmp/out", "");

	it("file-same should contain \"LEVEL2\"", function() {
		var results = parser.parse("test/html/level1/level2/file-same.shtml", buildIncludeFile("level2.html"));
		
		assert.equal("LEVEL2\n", results.contents);
	});

	it("file-relative should contain \"LEVEL1\"", function() {
		var results = parser.parse("test/html/level1/level2/file-relative.shtml", buildIncludeFile("../level1.html"));

		assert.equal("LEVEL1\n", results.contents);
	});
});

