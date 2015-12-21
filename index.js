
var SSI = require("./lib/SSI");

(function() {
	"use strict";

	var ssi = function(inputDirectory, outputDirectory, matcher, loosenedSpace) {
		this.parser = new SSI(inputDirectory, outputDirectory, matcher, loosenedSpace);
	};

	ssi.prototype = {
		compile: function() {
			return this.parser.compile();
		},
		parse: function(filename, contents) {
			return this.parser.parse(filename, contents);
		}
	};

	module.exports = ssi;
})();
