node-ssi
========

[![Build Status](https://travis-ci.org/kidwm/node-ssi.png)](https://travis-ci.org/kidwm/node-ssi)

Server Side Includes for NodeJS

__Note:__ The current version of ssi does all IO synchronously. Further development plans include writing methods asynchronously and migrating current methods to conform to Node conventions for synchronous methods.

### Supported Instructions

```html
<!--#include virtual="" -->
<!--#include file="" -->
<!--#set var="" value="" -->
<!--#echo var="" -->

<!--#if expr="" -->
<!--#elif expr="" -->
<!--#else -->
<!--#endif -->
```

### Installation

```bash
npm install ssi
```

### Usage

```javascript
var ssi = require("ssi");

var inputDirectory = "/tmp/test";
var outputDirectory = "/tmp/output";
var matcher = "/**/*.shtml";

var includes = new ssi(inputDirectory, outputDirectory, matcher);
includes.compile();
```

If you want to support loosened spaces in directive like `<!-- #include file="" -->` or `<!--  #include file=""  -->`, just enable the fourth argument: `new ssi(inputDirectory, outputDirectory, matcher, true)`.

### Methods

#### parse(filename, contents)
_filename_ `String` path to the file

_contents_ `String` Contents of the file to be parsed

Method returns the parsed contents

#### compile()

Method parses all of the files found by the matcher in the input directory, and writes the files to the output directory with identical names and directory structure.

### License

MIT
