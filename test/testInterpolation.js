
var assert = require("assert");
var ssi = require("../index.js");

function buildVarString(key, value) {
	return "<!--#set var=\"" + key + "\" value=\"" + value + "\" -->";
}

describe("string interpolation", function() {
	it("should not resolve ${nichts}", function() {
		var parser = new ssi("", "", "");
		var results = parser.parse("", buildVarString("variable", "${nichts}"));

		assert.equal("${nichts}", results.variables["variable"]);
	});

	it("should resolve ${test} as RESOLVED", function() {
		var html = buildVarString("variable", "RESOLVED") + buildVarString("result", "${variable}");

		var parser = new ssi("", "", "");
		var results = parser.parse("", html);

		assert.equal("RESOLVED", results.variables["result"]);
	});

	it("should not interpolate the resulting ${TROLL}", function() {
		var html = buildVarString("variable", "${TROLL}") + buildVarString("result", "${variable}");

		var parser = new ssi("", "", "");
		var results = parser.parse("", html);

		assert.equal("${TROLL}", results.variables["result"]);
	});

	it("should not chain interpolation", function() {
		var html = buildVarString("variable", "${TROLL}") + buildVarString("${TROLL}", "FAILED") +
			buildVarString("result", "${variable}");

		var parser = new ssi("", "", "");
		var results = parser.parse("", html);

		assert.equal("${TROLL}", results.variables["result"]);
	});

	it("should contain $PATH: " + process.env["PATH"], function() {
		var html = buildVarString("result", "${PATH}");

		var parser = new ssi("", "", "");
		var results = parser.parse("", html);

		assert.equal(process.env["PATH"], results.variables["result"]);
	});
});
