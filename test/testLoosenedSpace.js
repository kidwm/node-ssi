
var assert = require("assert");
var ssi = require("../index.js");

describe("Loosened directive space", function() {
	it("No spaces", function() {
		var parser = new ssi("", "", "", true);
		var results = parser.parse("", "<!--#set var=\"variable\" value=\"exists\"-->");

		assert.equal("exists", results.variables["variable"]);
	});

	it("both spaces", function() {
		var parser = new ssi("", "", "", true);
		var results = parser.parse("", "<!-- #set var=\"variable\" value=\"exists\" -->");

		assert.equal("exists", results.variables["variable"]);
	});

	it("multi spaces", function() {
		var parser = new ssi("", "", "", true);
		var results = parser.parse("", "<!-- #set var=\"variable\" value=\"exists\" -->");

		assert.equal("exists", results.variables["variable"]);
	});
});
