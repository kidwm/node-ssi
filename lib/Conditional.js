
module.exports = (function() {
	"use strict";

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

	// Export Conditional for use
	return Conditional;
})();
