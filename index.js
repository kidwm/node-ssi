
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

var INCLUDE_VIRTUAL = new RegExp(/<!--#include virtual="(.+?)" -->/g);
var INCLUDE_FILE = new RegExp(/<!--#include file="(.+?)" -->/g);

(function() {
	"use strict";

	var ssi = function(inputDirectory, outputDirectory, matcher) {
		this.inputDirectory = inputDirectory;
		this.documentRoot = inputDirectory;
		this.outputDirectory = outputDirectory;
		this.matcher = matcher;
	};
	
	ssi.prototype = {
		
		/* Public Methods */

		parse: function(filename, contents) {
			var instance = this;

			contents = contents.replace(INCLUDE_VIRTUAL, function(match, virtual) {
				return instance._readVirtual(virtual);
			});

			contents = contents.replace(INCLUDE_FILE, function(match, file) {
				return instance._readFile(filename, file);
			});

			return contents;
		},

		/* Private Methods */

		_readVirtual: function(virtual) {
			var filename = path.resolve(this.documentRoot, virtual);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		_readFile: function(currentFile, file) {
			var filename = path.resolve(path.dirname(currentFile), file);

			return fs.readFileSync(filename, {encoding: "utf8"});
		}
	};

	module.exports = ssi;
})();

