
var assert = require("assert");
var SSI = require("../lib/SSI.js");

describe("testing conditional expressions", function() {
	var parser = new SSI("", "", "").directiveHandler;
	var variables = {
		"true": true,
		"false": false,
		"test": "test",
		"empty": ""
	};

	it("true should be true", function() {
		var results = parser._parseExpression("true", variables);
		assert(results.truthy === true);
	});

	it("false should be false", function() {
		var results = parser._parseExpression("false", variables);
		assert(results.truthy === false);
	});

	it("${true} should be true", function() {
		var results = parser._parseExpression(parser._interpolate("${true}", variables, true));
		assert(results.truthy === true);
	});

	it("${false} should be false", function() {
		var results = parser._parseExpression(parser._interpolate("${false}", variables, true));
		assert(results.truthy === false);
	});

	it("${test} should be true", function() {
		var results = parser._parseExpression(parser._interpolate("${test}", variables, true));
		assert(results.truthy === true);
	});

	it("${empty} should be false", function() {
		var results = parser._parseExpression(parser._interpolate("${empty}", variables, true));
		assert(results.truthy === false);
	});

	it("no input should be false", function() {
		var results = parser._parseExpression("", variables);
		assert(results.truthy === false);
	});
});
