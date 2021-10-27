#!/usr/bin/env node

const fs = require("fs");
const { dirname } = require("path");

const ssi = require("..");

const [_node, _file, input, output] = process.argv;

const parser = new ssi(dirname(input), dirname(output), "*.shtml", true);

const { contents } = parser.parse(input, fs.readFileSync(input, "utf-8"));

fs.writeFileSync(output, contents);
