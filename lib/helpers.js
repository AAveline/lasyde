const chalk = require("chalk");
const { log } = console;

exports.pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);
exports.error = output => log(chalk.bold.red(output));
exports.info = output => log(chalk.bold.blue(output));
exports.success = output => log(chalk.bold.green(output));
