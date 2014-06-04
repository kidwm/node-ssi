
var fs = require("fs");
var assert = require("assert");

var ssi = require("../index.js");

describe("#include file", function() {
	var parser = new ssi("test/html", "/tmp/out", "");

	it("file-same should contain \"LEVEL2\"", function() {
		var filename = "test/html/level1/level2/file-same.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);
		
		assert.equal("LEVEL2\n\n", results.contents);
	});

	it("should include variables defined in included files", function() {
		var filename = "test/html/include-vars.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("FIRST", results.variables["FIRST_VAR"]);
		assert.equal("SECOND", results.variables["SECOND_VAR"]);
		assert.equal("\nFIRSTSECOND\n", results.contents);
	});

	it("should include variables in order of import", function() {
		var filename = "test/html/include-vars-order.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("FIRST", results.variables["FIRST"]);
		assert.equal("SECOND", results.variables["SECOND"]);
		assert.equal("OVERRIDDEN", results.variables["OVERRIDE"]);
		assert.equal("I DO!!", results.variables["EXISTS"]);
		assert.equal("\nFIRSTSECONDFUCK!!\n\nFIRSTSECONDOVERRIDDENI DO!!", results.contents);
	});

	it("should include nested variables", function() {
		var filename = "test/html/include-var-nested.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("NESTED!!", results.variables["NESTED"]);
		assert.equal("NESTED!!", results.contents);
	});

	it("should pass variables down into included files", function() {
		var filename = "test/html/include-root.shtml";
		var contents = fs.readFileSync(filename, {encoding: "utf8"});
		var results = parser.parse(filename, contents);

		assert.equal("Hallo, Welt! This should be included!", results.contents);
	});
});

