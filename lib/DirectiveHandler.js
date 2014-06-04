
var path = require("path");

var Conditional = require("./Conditional");

var DIRECTIVE_MATCHER = /<!--#([a-z]+)([ ]+([a-z]+)="(.+?)")* -->/g;
var ATTRIBUTE_MATCHER = /([a-z]+)="(.+?)"/g;
var INTERPOLATION_MATCHER = /\$\{(.+?)\}/g;

module.exports = (function() {
	"use strict";

	var mergeSimpleObject = function() {
		var output = {};

		for (var i = 0; i < arguments.length; i++) {
			var argument = arguments[i];

			for (var key in argument) {
				if (argument.hasOwnProperty(key)) {
					output[key] = argument[key];
				}
			}
		}

		return output;
	};

	var DirectiveHandler = function(ioUtils) {
		this.parser = undefined;
		this.ioUtils = ioUtils;
		this.conditionals = [];
		this.currentConditional = undefined;
	};

	DirectiveHandler.prototype = {

		/* Public Methods */

		handleDirective: function(directive, directiveName, currentFile, variables) {
			if (this._inConditional()) {
				if (!this._isConditional(directiveName)) {
					this.currentConditional.addDirective(directive);
					return {output: ""};
				}
			}

			var attributes = this._parseAttributes(directive);

			function interpolate() {
				for (var i = 0; i < attributes.length; i++) {
					var attribute = attributes[i];
					attribute.name = this._interpolate(attribute.name, variables, false);
					attribute.value = this._interpolate(attribute.value, variables, false);
				}
			}

			switch (directiveName) {
				case "if":
					interpolate.apply(this);
					return this._handleIf(attributes);
				case "elif":
					interpolate.apply(this);
					return this._handleElseIf(attributes);
				case "else":
					interpolate.apply(this);
					return this._handleElse();
				case "endif":
					interpolate.apply(this);
					return this._handleEndIf(currentFile, variables);
				case "set":
					interpolate.apply(this);
					return this._handleSet(attributes);
				case "echo":
					interpolate.apply(this);
					return this._handleEcho(attributes, variables);
				case "include":
					interpolate.apply(this);
					return this._handleInclude(attributes, currentFile, variables);
			}

			return {error: "Could not find parse directive #" + directiveName};
		},

		/* Private Methods */

		_interpolate: function(string, variables, shouldWrap) {
			var instance = this;

			return string.replace(INTERPOLATION_MATCHER, function(variable, variableName) {
				var value;

				// Either return the variable value or the original expression if it doesn't exist
				if (variables[variableName] !== undefined) {
					value = variables[variableName];
				} else if (process.env[variableName] !== undefined) {
					value = process.env[variableName];
				}

				if (value !== undefined) {
					if (shouldWrap) {
						// Escape all double quotes and wrap the value in double quotes
						return instance._wrap(variables[variableName]);
					}

					return value;
				}

				return variable;
			});
		},

		_parseAttributes: function(directive) {
			var attributes = [];

			directive.replace(ATTRIBUTE_MATCHER, function(attribute, name, value) {
				attributes.push({name: name, value: value});
			});

			return attributes;
		},

		_parseExpression: function(expression) {
			if (expression.match(INTERPOLATION_MATCHER)) {
				return {error: "Could not resolve all variables"}
			}

			// Return a boolean for the truthiness of the expression
			return {truthy: !!eval(expression)};
		},

		_wrap: function(value) {
			if (this._shouldWrap(value)) {
				return "\"" + value.toString().replace(/"/g, "\\\"") + "\"";
			}

			return value;
		},

		_shouldWrap: function(value) {
			var type = typeof value;

			return (type !== "boolean" && type !== "number");
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

		_handleEcho: function(attributes, variables) {
			if (attributes.length == 1 && attributes[0].name === "var") {
				return {output: variables[attributes[0].value]};
			}

			return {error: "Directive #echo did not contain a 'var' attribute"};
		},

		_handleInclude: function(attributes, currentFile, variables) {
			if (attributes.length !== 1) {
				return {error: "Directive #include did not contain the correct number of attributes"};
			} else if (attributes[0].name !== "virtual" && attributes[0].name !== "file") {
				return {error: "Directive #include did not contain a 'file' or 'virtual' attribute"};
			}

			var attribute = attributes[0];
			var attributeName = attribute.name;
			var filename = attribute.value;
			var results = {output: ""};

			if (attributeName === "file") {
				results = {output: this.ioUtils.readFileSync(currentFile, filename)};
			} else if (attributeName === "virtual") {
				results = {output: this.ioUtils.readVirtualSync(currentFile, filename)};
			}

			// Parse the contents of the file to handle SSI directives
			var parsed = this.parser.parse(this.ioUtils.resolveFullPath(currentFile, filename), results.output, variables);

			results.output = parsed.contents;
			results.variables = [];

			for (var key in parsed.variables) {
				if (parsed.variables.hasOwnProperty(key)) {
					results.variables.push({
						name: key,
						value: parsed.variables[key]
					});
				}
			}

			return results;
		},

		_handleIf: function(attributes) {
			this.conditionals = [];

			if (attributes.length === 1 && attributes[0].name === "expr") {
				// Create a new conditional, put it on the stack and assign as current conditional
				var conditional = new Conditional(attributes[0].value);
				this.conditionals.push(conditional);
				this.currentConditional = conditional;

				return {output: ""};
			}

			return {error: "If does not have a single 'expr' attribute"};
		},

		_handleElseIf: function(attributes) {
			if (attributes.length === 1 && attributes[0].name === "expr") {
				if (!this._inConditional()) {
					return {error: "Elif while not inside of If block"};
				}

				var conditional = new Conditional(attributes[0].value);
				this.conditionals.push(conditional);
				this.currentConditional = conditional;

				return {output: ""};
			}

			return {error: "Elif does not have a single 'expr' attribute"};
		},

		_handleElse: function() {
			if (!this._inConditional()) {
				return {error: "Else while not inside of If block"};
			}

			// As a hack, just provide an always true expression
			var conditional = new Conditional("true");
			this.conditionals.push(conditional);
			this.currentConditional = conditional;

			return {output: ""};
		},

		_handleEndIf: function(currentFile, pageVariables) {
			if (!this._inConditional()) {
				return {error: "Endif while not inside of If block"};
			}

			for (var i = 0; i < this.conditionals.length; i++) {
				var conditional = this.conditionals[i];
				var variables = {};

				// Find the first conditional that is true
				if (this._parseExpression(conditional.getExpression()).truthy) {
					var directiveHandler = new DirectiveHandler(this.ioUtils);
					var output = {output: "", variables: {}};

					// Iterate over the directives contained by the conditional, and parse them
					for (var j = 0; j < conditional.getDirectives().length; j++) {
						var directive = conditional.getDirectives()[j];
						// We can assume this matches the directive format
						//noinspection JSValidateTypes
						var directiveName = new RegExp(DIRECTIVE_MATCHER).exec(directive)[1];

						var results = directiveHandler.handleDirective(directive, directiveName, currentFile,
							mergeSimpleObject(variables, pageVariables));

						output.output += results.output || "";
						output.variables = mergeSimpleObject(output.variables, results.variables || {});
					}

					this.conditionals = [];
					this.currentConditional = undefined;
					return output;
				}
			}

			this.conditionals = [];
			this.currentConditional = undefined;
			return {output: ""};
		},

		_isConditional: function(directive) {
			return (directive === "if" || directive === "elif" || directive === "else" || directive === "endif");
		},

		_inConditional: function() {
			return this.conditionals.length > 0;
		}
	};

	// Export the DirectiveHandler for use
	return DirectiveHandler;
})();
