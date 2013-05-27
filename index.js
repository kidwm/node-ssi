
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var glob = require("glob");

var INCLUDE_VIRTUAL = /<!--#include virtual="(.+?)" -->/g;
var INCLUDE_FILE = /<!--#include file="(.+?)" -->/g;
var SET = /<!--#set var="(.+?)" value="(.+?)" -->/g;

var DIRECTIVE_MATCHER = /<!--#([a-z]+)[^\-\->]* -->/g;
var ATTRIBUTE_MATCHER = /([a-z]+)="(.+?)"/g;

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

	var DirectiveHandler = function(ioUtils) {
		this.ioUtils = ioUtils;
	};

	DirectiveHandler.prototype = {

		/* Public Methods */

		handleDirective: function(directive, directiveName, currentFile) {
			var attributes = this._parseAttributes(directive);

			switch (directiveName) {
				case "set":
					return this._handleSet(attributes);
				case "include":
					return this._handleInclude(attributes, currentFile);
			}

			return {warning: "Could not find parse directive #" + directiveName};
		},

		/* Private Methods */

		_parseAttributes: function(directive) {
			var attributes = [];

			directive.replace(ATTRIBUTE_MATCHER, function(attribute, name, value) {
				attributes.push({name: name, value: value});
			});

			return attributes;
		},

		_handleSet: function(attributes) {
			if (attributes.length === 2 && attributes[0].name === "var" &&
				attributes[1].name === "value") {
				return {variables: [{
					name: attributes[0].value,
					value: attributes[1].value
				}]};
			}

			return {error: "Directive #set did not contain a 'var' and 'value' attribute"};
		},

		_handleInclude: function(attributes, currentFile) {
			if (attributes.length === 1) {
				var attribute = attributes[0];

				if (attribute.name === "file") {
					return {output: this.ioUtils.readFileSync(currentFile, attribute.value)};
				} else if (attribute.name === "virtual") {
					return {output: this.ioUtils.readVirtualSync(attribute.value)};
				}
			}

			return {error: "Directive #include did not contain a 'file' or 'virtual' attribute"};
		}
	};


	var ssi = function(inputDirectory, outputDirectory, matcher) {
		this.inputDirectory = inputDirectory;
		this.documentRoot = inputDirectory;
		this.outputDirectory = outputDirectory;
		this.matcher = matcher;

		this.ioUtils = new IOUtils(this.documentRoot);
		this.directiveHandler = new DirectiveHandler(this.ioUtils);
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

			contents = contents.replace(DIRECTIVE_MATCHER, function(directive, directiveName) {
				var data = instance.directiveHandler.handleDirective(directive, directiveName, filename);

				for (var key in data.variables) {
					if (data.variables.hasOwnProperty(key)) {
						variables[data.variables[key].name] = data.variables[key].value;
					}
				}

				return (data && data.output) || "";
			});

			return {contents: contents, variables: variables};
		}

		/* Private Methods */

	};

	module.exports = ssi;
})();

