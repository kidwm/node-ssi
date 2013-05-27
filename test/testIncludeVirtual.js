
var assert = require("assert");
var ssi = require("../index.js");

function buildIncludeVirtual(virtual) {
	return "<!--#include virtual=\"" + virtual + "\" -->";
}

describe("#include virtual", function() {
	var parser = new ssi("test/html", "", "");

	it("virtual-same should contain \"ROOT\"", function() {
		var results = parser.parse("test/html/level1/level2/virtual-same.shtml", buildIncludeVirtual("root.html"));
	
		assert.equal("ROOT\n", results.contents);
	});

	it("virtual-relative should contain \"LEVEL1\"", function() {
		var results = parser.parse("test/html/level1/level2/virtual-relative.shtml", buildIncludeVirtual("level1/level1.html"));

		assert.equal("LEVEL1\n", results.contents);
	});

});

