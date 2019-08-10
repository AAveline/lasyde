const shell = require("shelljs");
const { error, info, success } = require("./helpers");

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

const updateFunction = options => {
  info("----------------------------");
  info(`Updating function...`);
  info("----------------------------");
  const { functionName, bucket, output } = options;
  shell.exec(
    bucket
      ? `aws lambda update-function-code --publish --function-name ${functionName} --s3-bucket ${bucket} --s3-key ${output}`
      : `aws lambda update-function-code --publish --function-name ${functionName} --zip-file fileb://${process.cwd()}/${output}`
  );
  success("=> Update completed");
  return options;
};

const publishFunction = options => {
  const { functionName } = options;
  info("----------------------------");
  info("Publishing function...");
  info("----------------------------");
  const { stdout } = shell.exec(
    `aws lambda publish-version --function-name ${functionName}`
  );
  const { Version, FunctionArn } = JSON.parse(stdout);

  success(`=> Published:
  Version: ${Version}
  FunctionArn: ${FunctionArn}            
  `);
  return options;
};

const updateAlias = options => {
  const { alias, functionName, aliases } = options;
  let version;

  info("----------------------------");
  info("Updating alias...");
  info("----------------------------");
  if (aliases[alias] === "up-to-date") {
    const { stdout } = shell.exec(
      `aws lambda list-versions-by-function --function-name ${functionName}`
    );

    const { Versions } = JSON.parse(stdout).Versions;
    version = Versions[Versions.length - 1].Version;
  }

  const { stdout } = shell.exec(
    `aws lambda update-alias --function-name ${functionName} --name ${alias} --function-version ${version ||
      aliases[alias]}`
  );
  const { FunctionVersion, Name, AliasArn } = JSON.parse(stdout);
  success(`=> Update completed:
  Name: ${Name}
  FunctionVersion: ${FunctionVersion}
  AliasArn: ${AliasArn} 
  `);
  return options;
};

const uploadToS3 = options => {
  if (!options.bucket) {
    return options;
  }

  info("----------------------------");
  info("Uploading to S3 Bucket...");
  info("----------------------------");
  const { bucket, key, alias } = options;

  shell.exec(
    `aws s3 sync ${process.cwd()}/.lasyde/${key} s3://${bucket}/${alias}/${key}`
  );
  success("=> Upload completed");
  return options;
};

const createAlias = options => {
  const { functionName, version = "$LATEST", alias, aliases } = options;

  info("----------------------------");
  info("=> Alias creation...");
  info("----------------------------");
  const { stdout } = shell.exec(
    `aws lambda create-alias --function-name ${functionName} --name ${alias} --function-version ${aliases[
      alias
    ] || version}`
  );
  const { FunctionVersion, Name, AliasArn } = JSON.parse(stdout);
  success(`=> Creation completed:
     Name: ${Name}
     FunctionVersion: ${FunctionVersion}
     AliasArn: ${AliasArn} 
  `);
  return options;
};

const prune = options => {
  const { functionName, prune } = options;

  if (!prune || prune < 1) {
    return options;
  }

  info("----------------------------");
  info("Prune unused versions...");
  info("----------------------------");
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
    // Ignore $LATEST.
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
    ({ FunctionArn }) =>
      !versionsToKeep.find(v => FunctionArn === v.FunctionArn)
  );

  for (const { Version } of versionsToPrune) {
    shell.exec(
      `aws lambda delete-function --function-name ${functionName} --qualifier ${Version}`
    );
  }
  success(`=> Prune ${versionsToPrune.length} versions`);
  return options;
};

const processAlias = options => {
  const { alias } = options;
  const isAliasDefined = getAliases(options).find(({ Name }) => Name === alias);

  if (isAliasDefined) {
    updateAlias(options);
  } else {
    createAlias(options);
  }
  return options;
};

module.exports = {
  updateFunction,
  uploadToS3,
  getFunction,
  processAlias,
  publishFunction,
  prune
};
