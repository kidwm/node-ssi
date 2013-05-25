
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

var INCLUDE_VIRTUAL = new RegExp(/<!--#include virtual="(.+?" -->/g);

(function() {
	"use strict";

	var ssi = function(inputDirectory, outputDirectory, matcher) {
		this.inputDirectory = inputDirectory;
		this.outputDirectory = outputDirectory;
		this.matcher = matcher;
	};
	
	ssi.prototype = {
		
		/* Public Methods */

		parse: function(filename, contents) {
			var instance = this;

			contents = contents.replace(INCLUDE_VIRTUAL, function(match, virtual) {
				return instance._readVirtual(filename, virtual);
			});
		},

		/* Private Methods */

		_readVirtual: function(currentFile, virtual) {
			var directory = path.dirname(currentFile);
			var filename = path.resolve(directory, virtual);
			
			return fs.readFileSync(filename, {encoding: "utf8"});
		}
	};

	module.exports = ssi;
})();

