
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

		resolveFullPath: function(currentFile, file) {
			return path.resolve(path.dirname(currentFile), file);
		},

		readFileSync: function(currentFile, includeFile) {
			var filename = this.resolveFullPath(currentFile, includeFile);

			return fs.readFileSync(filename, {encoding: "utf8"});
		},

		readVirtualSync: function(currentFile, includeFile) {
			var filename;

			if (includeFile.indexOf("/") === 0) {
				// If we have an absolute path, resolve against the document root
				filename = path.resolve(this.documentRoot, includeFile.substr(1));
			} else {
				// Otherwise resolve the file against the current file
				filename = this.resolveFullPath(currentFile, includeFile);
			}

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
