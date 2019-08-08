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
    //`aws lambda update-function-code --publish --function-name ${functionName} --zip-file fileb://${process.cwd()}/${output}`,
    `aws lambda update-function-code --publish --function-name ${functionName} --s3-bucket ${bucket} --s3-key ${output}`
  );
};

const publishFunction = ({ functionName }) => {
  shell.exec(`aws lambda get-function --function-name ${functionName}`);
};

const updateAlias = ({ alias, functionName, aliases }) => {
  shell.exec(
    `aws lambda update-alias --function-name ${functionName} --name ${alias} --function-version ${
      aliases[alias]
    }`
  );
};
const updateS3Code = ({ bucket, key }) => {
  shell.exec(`aws s3 sync ${process.cwd()}/${key} s3://${bucket}/${key}`);
};

const createAlias = ({ functionName, version = "$LATEST", alias, aliases }) => {
  shell.exec(
    `aws lambda create-alias --function-name ${functionName} --name ${alias} --function-version ${aliases[
      alias
    ] || version}`
  );
};

module.exports = {
  updateAlias,
  updateFunction,
  updateS3Code,
  getAliases,
  getFunction,
  createAlias,
  publishFunction
};
