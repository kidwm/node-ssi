
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var glob = require("glob");

var INCLUDE_VIRTUAL = new RegExp(/<!--#include virtual="(.+?)" -->/g);
var INCLUDE_FILE = new RegExp(/<!--#include file="(.+?)" -->/g);
var SET = new RegExp(/<!--#set var="(.+?)" value="(.+?)" -->/g);

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
		
		compile: function() {
			var files = glob.sync(this.inputDirectory + this.matcher);

			for (var i = 0; i < files.length; i++) {
				var input = files[i];
				var contents = fs.readFileSync(input, {encoding: "utf8"});
				var data = this.parse(input, contents);

				var output = input.replace(this.inputDirectory, this.outputDirectory);
				this._writeFile(output, data.contents);
			}
		},

		parse: function(filename, contents) {
			var instance = this;
			var variables = {};

			contents = contents.replace(SET, function(match, key, value) {
				variables[key] = value;
				return "";
			});

			contents = contents.replace(INCLUDE_VIRTUAL, function(match, virtual) {
				return instance._readVirtual(virtual);
			});

			contents = contents.replace(INCLUDE_FILE, function(match, file) {
				return instance._readFile(filename, file);
			});

			return {contents: contents, variables: variables};
		},

		/* Private Methods */

		_readVirtual: function(virtual) {
			var filename = path.resolve(this.documentRoot, virtual);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		_readFile: function(currentFile, file) {
			var filename = path.resolve(path.dirname(currentFile), file);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		_writeFile: function(filename, contents) {
			var directory = path.dirname(filename);

			if (!fs.existsSync(directory)) {
				// If the file's directory doesn't exists, recusively create it
				mkdirp.sync(directory);
			}

			fs.writeFileSync(filename, contents, {encoding: "utf8"});
		}
	};

	module.exports = ssi;
})();

