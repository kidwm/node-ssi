
var fs = require("fs");
var assert = require("assert");

var ssi = require("../index.js");

describe("", function() {
	"use strict";

	var parser = new ssi("test/html", "/tmp/out", "");

	it("", function() {
		var filename = "test/html/nested-parent.html";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("PARENT\nCHILD\nGRANDCHILD\n\n\n", results.contents);
	});
});
