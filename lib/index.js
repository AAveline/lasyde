const AdmZip = require("adm-zip");
const fs = require("fs");
const shell = require("shelljs");
const { info, error, success } = require("./helpers");
const { pipe } = require("./helpers");
const zip = new AdmZip();

const REQUIREMENTS = ["aws"];

const {
  updateFunction,
  uploadToS3,
  getFunction,
  processAlias,
  publishFunction,
  prune
} = require("./aws");

exports.checkRequirements = args => {
  REQUIREMENTS.forEach(requirement => {
    if (!shell.which(requirement)) {
      error(`${requirement} is required`);
      process.exit(1);
    }
  });

  return [args];
};

exports.formatOptions = ([args]) => {
  const configFile = fs.readFileSync(process.cwd() + "/lasyde.config.json");

  if (!configFile) {
    error("Config file is required");
    process.exit(1);
  }

  const targetArg = args.findIndex(arg => arg === "--target");
  const aliasArg = args.findIndex(arg => arg === "--alias");
  const areAllCLiArgsDefined = [targetArg, aliasArg].every(arg => arg > -1);

  if (!areAllCLiArgsDefined) {
    error("Required args: target, alias");
    process.exit(1);
  }

  const target = args[targetArg + 1];
  const config = JSON.parse(configFile.toString())[target];

  const REQUIRED_CONFIG_ENTRIES = [
    "src",
    "key",
    "file",
    "functionName",
    "aliases"
  ];

  const areAllConfigEntriesDefined = REQUIRED_CONFIG_ENTRIES.every(
    key => !!config[key]
  );

  if (!areAllConfigEntriesDefined) {
    error("Required config values: src, key, file, functionName, aliases");
    process.exit(1);
  }

  return {
    ...config,
    output: config.key + "/" + config.file,
    ...(aliasArg > -1 && { alias: args[aliasArg + 1] })
  };
};

exports.zip = options => {
  try {
    info("----------------------------");
    info("Packaging in progress...");
    info("----------------------------");
    const { src, output, key, alias } = options;
    zip.addLocalFolder(`${process.cwd()}/${src}`);
    zip.toBuffer();
    shell.mkdir(`${process.cwd()}/.lasyde`);

    shell.mkdir(`${process.cwd()}/.lasyde/${alias}`);
    zip.writeZip(`${process.cwd()}/.lasyde/${alias}/${output}`);

    success(`=> Folder zipped in ${process.cwd()}/.lasyde/${alias}/${output}`);

    return options;
  } catch (e) {
    error(e);
  }
};

exports.main = options => {
  try {
    pipe(
      uploadToS3,
      updateFunction,
      publishFunction,
      processAlias,
      prune
    )(options);

    const { Configuration } = getFunction(options);
    success("----------------------------");
    success("Success!");
    success("----------------------------");
    console.log(Configuration);
  } catch (e) {
    error(e);
  }
};
