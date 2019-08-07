#!/usr/bin/env node
const { formatMap, checkRequirements, zip, main } = require("../lib");
const { pipe } = require("../lib/helpers");

pipe(
  checkRequirements,
  formatMap,
  zip,
  main
)(process.argv);
