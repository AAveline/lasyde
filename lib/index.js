const AdmZip = require("adm-zip");
const shell = require("shelljs");
const zip = new AdmZip();
const REQUIREMENTS = ["aws"];

exports.checkRequirements = args => {
  REQUIREMENTS.forEach(requirement => {
    if (!shell.which(requirement)) {
      throw "aws-cli must be installed";
    }
  });

  return [args];
};

exports.formatMap = ([args]) => {
  const pathArg = args.findIndex(arg => arg === "--path");
  const outputArg = args.findIndex(arg => arg === "--output");
  const functionNameArg = args.findIndex(arg => arg === "--function-name");
  const aliasArg = args.findIndex(arg => arg === "--alias");

  const hasAllRequiredArgsDefined = [pathArg, outputArg, functionNameArg].every(
    arg => arg > -1
  );

  if (!hasAllRequiredArgsDefined) {
    throw "Required args: path, output, function-name";
  }

  return [
    args,
    {
      path: args[pathArg + 1],
      output: args[outputArg + 1],
      functionName: args[functionNameArg + 1],
      ...(aliasArg > -1 && { alias: args[aliasArg + 1] })
    }
  ];
};

exports.zip = ([args, map]) => {
  try {
    const { path, output } = map;
    zip.addLocalFolder(path);
    zip.toBuffer();
    zip.writeZip(output);

    console.log("Zipped");

    return [args, map];
  } catch (e) {
    console.error(e);
  }
};

exports.main = ([args, map]) => {
  try {
    console.log(map);
    const { stdout } = shell.exec(
      "aws lambda list-versions-by-function --function-name admin-api-organizations",
      { silent: true }
    );
    const { Versions } = JSON.parse(stdout);

    console.log("Done");
  } catch (e) {
    console.error(e);
  }
};
