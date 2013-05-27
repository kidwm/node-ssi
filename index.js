
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var glob = require("glob");

var INCLUDE_VIRTUAL = /<!--#include virtual="(.+?)" -->/g;
var INCLUDE_FILE = /<!--#include file="(.+?)" -->/g;
var SET = /<!--#set var="(.+?)" value="(.+?)" -->/g;

(function() {
	"use strict";

	var IOUtils = function(documentRoot) {
		this.documentRoot = documentRoot;
	};

	IOUtils.prototype = {

		/* Public Methods */

		readFileSync: function(currentFile, includeFile) {
			var filename = path.resolve(path.dirname(currentFile), includeFile);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		readVirtualSync: function(includeFile) {
			var filename = path.resolve(this.documentRoot, includeFile);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		writeFileSync: function(filename, contents) {
			var directory = path.dirname(filename);

			if (!fs.existsSync(directory)) {
				// If the file's directory doesn't exists, recursively create it
				mkdirp.sync(directory);
			}

			fs.writeFileSync(filename, contents, {encoding: "utf8"});
		}

		/* Private Methods */
	};

	var ssi = function(inputDirectory, outputDirectory, matcher) {
		this.inputDirectory = inputDirectory;
		this.documentRoot = inputDirectory;
		this.outputDirectory = outputDirectory;
		this.matcher = matcher;

		this.ioUtils = new IOUtils(this.documentRoot);
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
				this.ioUtils.writeFileSync(output, data.contents);
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
				return instance.ioUtils.readVirtualSync(virtual);
			});

			contents = contents.replace(INCLUDE_FILE, function(match, file) {
				return instance.ioUtils.readFileSync(filename, file);
			});

			return {contents: contents, variables: variables};
		}

		/* Private Methods */

	};

	module.exports = ssi;
})();

