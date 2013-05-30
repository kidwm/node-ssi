
var assert = require("assert");
var ssi = require("../index.js");

describe("testing conditional directives", function() {
	var parser = new ssi("", "", "");

	it("#if should evaluate to true", function() {
		var conditional = "<!--#if expr=\"true\" --><!--#set var=\"cats\" value=\"cats\" --><!--#endif -->";
		var results = parser.parse("", conditional);

		assert.equal("cats", results.variables["cats"]);
	});

//	it("#elif should evaluate to true", function() {
//		assert(false);
//	});
//
//	it("second #elif should evaluate to true", function() {
//		assert(false);
//	});
//
//	it("#else should evaluate to true", function() {
//		assert(false);
//	});
//
//	it("nothing should evaluate to true", function() {
//		assert(false);
//	});
});
