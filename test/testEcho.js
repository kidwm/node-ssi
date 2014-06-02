
var assert = require("assert");
var ssi = require("../index.js");

describe("#echo", function() {
	var set = "<!--#set var=\"TEST_VAR\" value=\"TEST_VALUE\" -->";
	var echoContent = "<!--#echo var=\"TEST_VAR\" -->";
	var echoEmpty = "<!--#echo var=\"EMPTY_VAR\" -->";

	it("it should output a value where available", function() {
		var parser = new ssi("", "", "");
		var results = parser.parse("", (set + echoContent));

		assert.equal("TEST_VALUE", results.contents);
	});

	it("it should output nothing when nothing is found", function() {
		var parser = new ssi("", "", "");
		var results = parser.parse("", (set + echoEmpty));
		
		assert.equal("", results.contents);
	});
});

