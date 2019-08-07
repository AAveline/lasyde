#!/usr/bin/env node
const { formatMap, main } = require("../lib");
const { pipe } = require("../lib/helpers");

pipe(
  formatMap,
  main
)(process.argv);
