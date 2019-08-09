const AdmZip = require("adm-zip");
const fs = require("fs");
const shell = require("shelljs");
const { log, error } = console;
const { pipe } = require("./helpers");
const zip = new AdmZip();

const REQUIREMENTS = ["aws"];

const {
  updateAlias,
  updateFunction,
  uploadToS3,
  getAliases,
  getFunction,
  createAlias,
  publishFunction,
  prune
} = require("./aws");

exports.checkRequirements = args => {
  REQUIREMENTS.forEach(requirement => {
    if (!shell.which(requirement)) {
      throw `${requirement} is required`;
    }
  });

  return [args];
};

exports.formatMap = ([args]) => {
  const configFile = fs.readFileSync(process.cwd() + "/lasyde.config.json");

  const targetArg = args.findIndex(arg => arg === "--target");
  const aliasArg = args.findIndex(arg => arg === "--alias");

  if (!configFile) {
    throw "Config file is required";
  }

  if (targetArg === -1) {
    throw "Required args: target";
  }

  const target = args[targetArg + 1];

  const config = JSON.parse(configFile.toString())[target];

  if (!config) {
    throw "Target not defined in config file !";
  }

  return {
    ...config,
    output: config.key + "/" + config.file,
    ...(aliasArg > -1 && { alias: args[aliasArg + 1] })
  };
};

exports.zip = map => {
  try {
    const { src, output } = map;
    zip.addLocalFolder(`${process.cwd()}/${src}`);
    zip.toBuffer();
    zip.writeZip(`${process.cwd()}/${output}`);

    log("Zipped");

    return map;
  } catch (e) {
    error(e);
  }
};

exports.main = map => {
  try {
    const { alias } = map;

    const aliases = getAliases(map);
    // Upload code to S3 bucket. TODO: Handle blob.
    if (map.bucket) {
      uploadToS3(map);
    }
    // Update function with provided code src and publish option enabled.
    updateFunction(map);

    publishFunction(map);

    const aliasExists = aliases.find(({ Name }) => Name === alias);

    if (aliasExists) {
      updateAlias(map);
    } else {
      log("Alias not found, creation in progress...");
      createAlias(map);
      log("Alias created !");
      updateAlias(map);
    }

    if (map.prune) {
      prune(map);
    }

    const functionConfiguration = getFunction(map);
    log(functionConfiguration);
  } catch (e) {
    error(e);
  }
};
