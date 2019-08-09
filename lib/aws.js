const shell = require("shelljs");

shell.config.silent = true;

const getAliases = ({ functionName }) => {
  const { stdout } = shell.exec(
    `aws lambda list-aliases --function-name ${functionName}`
  );
  const { Aliases } = JSON.parse(stdout);
  return Aliases;
};
const getFunction = ({ functionName }) => {
  const { stdout } = shell.exec(
    `aws lambda get-function --function-name ${functionName}`
  );

  return JSON.parse(stdout);
};

const updateFunction = ({ functionName, bucket, output }) => {
  shell.exec(
    bucket
      ? `aws lambda update-function-code --publish --function-name ${functionName} --s3-bucket ${bucket} --s3-key ${output}`
      : `aws lambda update-function-code --publish --function-name ${functionName} --zip-file fileb://${process.cwd()}/${output}`
  );
};

const publishFunction = ({ functionName }) => {
  shell.exec(`aws lambda publish-version --function-name ${functionName}`);
};

const updateAlias = ({ alias, functionName, aliases }) => {
  let version;

  if (aliases[alias] === "up-to-date") {
    const { stdout } = shell.exec(
      `aws lambda list-versions-by-function --function-name ${functionName}`
    );

    const versions = JSON.parse(stdout).Versions;
    version = versions[versions.length - 1].Version;
  }

  shell.exec(
    `aws lambda update-alias --function-name ${functionName} --name ${alias} --function-version ${version ||
      aliases[alias]}`
  );
};
const uploadToS3 = ({ bucket, key }) => {
  shell.exec(`aws s3 sync ${process.cwd()}/${key} s3://${bucket}/${key}`);
};

const createAlias = ({ functionName, version = "$LATEST", alias, aliases }) => {
  shell.exec(
    `aws lambda create-alias --function-name ${functionName} --name ${alias} --function-version ${aliases[
      alias
    ] || version}`
  );
};

const prune = ({ functionName, prune }) => {
  const { stdout: versions } = shell.exec(
    `aws lambda list-versions-by-function --function-name ${functionName} --no-paginate`
  );

  const { Versions } = JSON.parse(versions);

  const { stdout: aliases } = shell.exec(
    `aws lambda list-aliases --function-name ${functionName} --no-paginate`
  );

  const { Aliases } = JSON.parse(aliases);

  const aliasVersion = Aliases.filter(
    ({ FunctionVersion }) => !!parseInt(FunctionVersion)
  )
    .map(({ FunctionVersion }) => parseInt(FunctionVersion))
    .sort((a, b) => b - a);

  const versionsToKeep = Versions.reduce((acc, version) => {
    const versionNumber = parseInt(version.Version);

    for (const alias of aliasVersion) {
      const isInRange =
        (versionNumber < alias && versionNumber + prune >= alias) ||
        alias === versionNumber;
      if (isInRange) {
        return [...acc, version];
      }
    }

    return acc;
  }, []);

  const versionsToPrune = Versions.filter(
    version => !versionsToKeep.find(v => version.FunctionArn === v.FunctionArn)
  );

  for (const version of versionsToPrune) {
    shell.exec(
      `aws lambda delete-function --function-name ${functionName} --qualifier ${
        version.Version
      }`
    );
  }
};

module.exports = {
  updateAlias,
  updateFunction,
  uploadToS3,
  getAliases,
  getFunction,
  createAlias,
  publishFunction,
  prune
};
