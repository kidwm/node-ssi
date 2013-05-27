
var assert = require("assert");
var ssi = require("../index.js");

function buildVarString(key, value) {
	return "<!--#set var=\"" + key + "\" value=\"" + value + "\" -->";
}

describe("#set", function() {
	it("should return \"variable: exists\"", function() {
		var parser = new ssi("", "", "");
		var results = parser.parse("", buildVarString("variable", "exists"));

		assert.equal("exists", results.variables["variable"]);
	});

	it("should return \"variable: overridden\"", function() {
		var parser = new ssi("", "", "");
		var results = parser.parse("", buildVarString("variable", "exists") + buildVarString("variable", "overridden"));
		
		assert.equal("overridden", results.variables["variable"]);
	});
});

