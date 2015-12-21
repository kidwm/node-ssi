
var fs = require("fs");
var glob = require("glob");

var IOUtils = require("./IOUtils");
var DirectiveHandler = require("./DirectiveHandler");

(function() {
	"use strict";

	var ssi = function(inputDirectory, outputDirectory, matcher, loosenedSpace) {
		this.inputDirectory = inputDirectory;
		this.documentRoot = inputDirectory;
		this.outputDirectory = outputDirectory;
		this.matcher = matcher;

		this.directiveRegex = loosenedSpace ? /<!--[ ]*#([a-z]+)([ ]+([a-z]+)="(.+?)")*[ ]*-->/g : /<!--#([a-z]+)([ ]+([a-z]+)="(.+?)")* -->/g;

		this.ioUtils = new IOUtils(this.documentRoot);
		this.directiveHandler = new DirectiveHandler(this.ioUtils, this.directiveRegex);
		this.directiveHandler.parser = this;
	};

	ssi.prototype = {
		compile: function() {
			//noinspection JSUnresolvedFunction
			var files = glob.sync(this.inputDirectory + this.matcher);

			for (var i = 0; i < files.length; i++) {
				var input = files[i];
				var contents = fs.readFileSync(input, {encoding: "utf8"});
				var data = this.parse(input, contents);

				var output = input.replace(this.inputDirectory, this.outputDirectory);
				this.ioUtils.writeFileSync(output, data.contents);
			}
		},

		parse: function(filename, contents, variables) {
			var instance = this;
			variables = variables || {};

			contents = contents.replace(new RegExp(instance.directiveRegex), function(directive, directiveName) {
				var data = instance.directiveHandler.handleDirective(directive, directiveName, filename, variables);

				if (data.error) {
					throw data.error;
				}

				for (var key in data.variables) {
					if (data.variables.hasOwnProperty(key)) {
						variables[data.variables[key].name] = data.variables[key].value;
					}
				}

				return (data && data.output) || "";
			});

			return {contents: contents, variables: variables};
		}
	};

	module.exports = ssi;
})();
