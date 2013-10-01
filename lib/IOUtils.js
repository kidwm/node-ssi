
var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");

module.exports = (function() {
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
				//noinspection JSUnresolvedFunction
				mkdirp.sync(directory);
			}

			fs.writeFileSync(filename, contents, {encoding: "utf8"});
		}

		/* Private Methods */
	};

	// Export the IOUtils class for use
	return IOUtils;
})();
