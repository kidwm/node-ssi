
var assert = require("assert");
var SSI = require("../lib/SSI");

describe("testing conditional directives", function() {
	var parser = new SSI("", "", "");

	it("#if should evaluate to true", function() {
		var conditional = "<!--#if expr=\"true\" --><!--#set var=\"if\" value=\"if\" --><!--#endif -->";
		var results = parser.parse("", conditional);

		assert.equal("if", results.variables["if"]);
	});

	it("#elif should evaluate to true", function() {
		var conditional = "<!--#if expr=\"false\" -->";
		conditional += "<!--#set var=\"if\" value=\"if\" -->";
		conditional += "<!--#elif expr=\"true\" -->";
		conditional += "<!--#set var=\"elif\" value=\"elif\" -->";
		conditional += "<!--#endif -->";

		var results = parser.parse("", conditional);

		assert.equal("elif", results.variables["elif"]);
	});

	it("second #elif should evaluate to true", function() {
		var conditional = "<!--#if expr=\"false\" -->";
		conditional += "<!--#set var=\"if\" value=\"if\" -->";
		conditional += "<!--#elif expr=\"false\" -->";
		conditional += "<!--#set var=\"elif\" value=\"elif\" -->";
		conditional += "<!--#elif expr=\"true\" -->";
		conditional += "<!--#set var=\"elif2\" value=\"elif2\" -->";
		conditional += "<!--#endif -->";

		var results = parser.parse("", conditional);
		assert.equal("elif2", results.variables["elif2"]);
	});

	it("#else should evaluate to true", function() {
		var conditional = "<!--#if expr=\"false\" -->";
		conditional += "<!--#set var=\"if\" value=\"if\" -->";
		conditional += "<!--#else -->";
		conditional += "<!--#set var=\"else\" value=\"else\" -->";
		conditional += "<!--#endif -->";

		var results = parser.parse("", conditional);
		assert.equal("else", results.variables["else"]);
	});

	it("nothing should evaluate to true", function() {
		var conditional = "<!--#if expr=\"false\" -->";
		conditional += "<!--#set var=\"if\" value=\"if\" -->";
		conditional += "<!--#elif expr=\"false\" -->";
		conditional += "<!--#set var=\"elif\" value=\"elif\" -->";
		conditional += "<!--#endif -->";

		var results = parser.parse("", conditional);
		assert.deepEqual({}, results.variables);
	});
});
