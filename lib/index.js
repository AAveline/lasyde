const AdmZip = require("adm-zip");
const fs = require("fs");

const shell = require("shelljs");
const zip = new AdmZip();
const REQUIREMENTS = ["aws"];

/**
 *
 */
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
  // TODO: refactor
  const config = JSON.parse(configFile.toString())[target];
  return [
    args,
    {
      ...config,
      output: config.key + "/" + config.file,
      ...(aliasArg > -1 && { alias: args[aliasArg + 1] })
    }
  ];
};

exports.zip = ([args, map]) => {
  try {
    const { src, output } = map;
    zip.addLocalFolder(`${process.cwd()}/${src}`);
    zip.toBuffer();
    zip.writeZip(`${process.cwd()}/${output}`);

    console.log("Zipped");

    return [args, map];
  } catch (e) {
    console.error(e);
  }
};
const getAliases = ({ functionName }) => {
  const { stdout } = shell.exec(
    `aws lambda list-aliases --function-name ${functionName}`,
    { silent: true }
  );
  const { Aliases } = JSON.parse(stdout);
  return Aliases;
};
const getFunction = ({ functionName }) => {
  const { stdout } = shell.exec(
    `aws lambda get-function --function-name ${functionName}`,
    { silent: true }
  );

  return JSON.parse(stdout);
};

const updateFunction = ({ functionName, bucket, output }) => {
  shell.exec(
    //`aws lambda update-function-code --publish --function-name ${functionName} --zip-file fileb://${process.cwd()}/${output}`,
    `aws lambda update-function-code --publish --function-name ${functionName} --s3-bucket ${bucket} --s3-key ${output}`,
    { silent: true }
  );
};

const publishFunction = ({ functionName }) => {
  shell.exec(`aws lambda get-function --function-name ${functionName}`, {
    silent: true
  });
};

const updateAlias = ({ alias, functionName, aliases }) => {
  const { stdout } = shell.exec(
    `aws lambda update-alias --function-name ${functionName} --name ${alias} --function-version ${
      aliases[alias]
    }`,
    { silent: true }
  );

  return JSON.parse(stdout);
};
const updateS3Code = ({ bucket, key }) => {
  shell.exec(`aws s3 sync ${process.cwd()}/${key} s3://${bucket}/${key}`, {
    silent: true
  });
};
exports.main = ([args, map]) => {
  try {
    const { alias } = map;

    const aliases = getAliases(map);

    updateS3Code(map);

    const functionConfiguration = getFunction(map);

    updateFunction(map);

    publishFunction(map);

    const aliasExists = aliases.find(({ Name }) => Name === alias);

    if (aliasExists) {
      updateAlias(map);
    }

    //console.log(aliases);
    console.log("Done");
  } catch (e) {
    console.error(e);
  }
};
