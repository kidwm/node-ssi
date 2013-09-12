
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var glob = require("glob");

var DIRECTIVE_MATCHER = /<!--#([a-z]+)([ ]+([a-z]+)="(.+?)")* -->/g;
var ATTRIBUTE_MATCHER = /([a-z]+)="(.+?)"/g;
var INTERPOLATION_MATCHER = /\$\{(.+?)\}/g;

(function() {
	"use strict";
    
    var buildFilesObject = function( files ) {
        
        var file
            , absPath
            , matches
            , curFile
            , curMatch
            , fileContents
            , absPathImport
            , origPathImport
            , data = {}
            , graph = {}
            ;
        
        files.forEach( function( file ) {

            absPath = path.resolve( file );
            fileContents = fs.readFileSync( absPath, { encoding: 'utf8' } );

            if ( !fileContents ) error( 'File does not exist: "' + absPath + '"' );
            
            graph[ absPath ] = [];
            curFile = data[ absPath ] = {};
            matches = fileContents.match( DIRECTIVE_MATCHER );
            
            if ( matches ) {
                
                curFile.includes = {};
            
                matches.forEach( function( theMatch ) {
                
                    curMatch = theMatch.match( /<!--#include virtual="(.+?)" -->/ );
                    
                    if ( curMatch ) {
                        
                        origPathImport = curMatch[1];
                        absPathImport = path.resolve( path.dirname( absPath ), origPathImport ).replace( /\\/g, '/' );
                    
                        graph[ absPath ].push( absPathImport );
                        curFile.includes[ absPathImport ] = {
                            path: curMatch[1]
                        }
                    }
                
                }, this );
            }
            
            // console.log( '  [parsed] ' + absPath );
            
        }, this );
        
        return {
            data: data,
            graph: graph
        }
        
        return files;
    }
    
    var sortByDependency = function( files ) {
        
        var sorted = [] 
            , count = 0
            , self = this
            , visited = {}
            , filesObj = buildFilesObject( files )
            , data = filesObj.data
            , graph = filesObj.graph
            ;

        var visit = function( name, ancestors ) {
            
            var parentFile = data[ name ]
                , includes = parentFile.includes
                ;
            
            if ( visited[ name ] ) return;

            if ( !Array.isArray( ancestors ) ) ancestors = [];

            ancestors.push( name );
            visited[ name ] = true;
            
            graph[ name ].forEach( function( dep ) {
                
                // If already in ancestors, a closed chain exists.
                if ( ancestors.indexOf( dep ) >= 0 ) {
                    error( 'Circular dependency found: "' +  dep + '" is required by "' + name + '"( ' + ancestors.join( ' -> ' ) + ' )' );
                }

                visit( dep, ancestors.slice( 0 ) );
            });
            
            sorted.push( name );
            // console.log( '  [' + ++count + '] ' + name );
        }

        Object.keys( graph ).forEach( visit );

        return sorted;
    }

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

	var IOUtils = function(documentRoot) {
		this.documentRoot = documentRoot;
	};

	IOUtils.prototype = {

		/* Public Methods */

		readFileSync: function(currentFile, includeFile) {
			var filename = path.resolve(path.dirname(currentFile), includeFile);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		readVirtualSync: function(currentFile, includeFile) {
			var filename = path.resolve(path.dirname(currentFile), includeFile);

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

	var Conditional = function(expression) {
		this.expression = expression;
		this.directives = [];
	};

	Conditional.prototype = {
		getExpression: function() {
			return this.expression;
		},

		getDirectives: function() {
			return this.directives;
		},

		addDirective: function(directive) {
			this.directives.push(directive);
		}
	};

	var DirectiveHandler = function(ioUtils) {
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
				case "include":
					interpolate.apply(this);
					return this._handleInclude(attributes, currentFile);
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

		_handleInclude: function(attributes, currentFile) {
			if (attributes.length === 1) {
				var attribute = attributes[0];

				if (attribute.name === "file") {
					return {output: this.ioUtils.readFileSync(currentFile, attribute.value)};
				} else if (attribute.name === "virtual") {
					return {output: this.ioUtils.readVirtualSync(currentFile, attribute.value)};
				}
			}

			return {error: "Directive #include did not contain a 'file' or 'virtual' attribute"};
		},

		_handleIf: function(attributes) {
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
						var directiveName = DIRECTIVE_MATCHER.exec(directive)[1];

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
            
            files = sortByDependency( files );
            this.sorted = files;
            // console.log( files );

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
				var data = instance.directiveHandler.handleDirective(directive, directiveName, filename, variables);

				if (data.error) throw data.error;

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