#!/usr/bin/env node
const { formatOptions, checkRequirements, zip, main } = require("../lib");
const { pipe } = require("../lib/helpers");

if (process.argv.includes("deploy")) {
  pipe(
    checkRequirements,
    formatOptions,
    zip,
    main
  )(process.argv);
}
