const AdmZip = require("adm-zip");

const zip = new AdmZip();

exports.formatMap = args => {
  const pathArg = args.findIndex(arg => arg === "--path");
  const outputArg = args.findIndex(arg => arg === "--output");
  const nameArg = args.findIndex(arg => arg === "--function-name");
  const aliasArg = args.findIndex(arg => arg === "--alias");

  const hasAllRequiredArgsDefined = [pathArg, outputArg, nameArg].every(
    arg => arg > -1
  );

  if (!hasAllRequiredArgsDefined) {
    throw "Required args: path, output, function-name";
  }

  return {
    path: args[pathArg + 1],
    output: args[outputArg + 1],
    ...(aliasArg > -1 && { alias: args[aliasArg + 1] })
  };
};

exports.main = map => {
  try {
    console.log(map);
    zip.addLocalFolder(map.path);
    zip.toBuffer();
    zip.writeZip(map.output);

    console.log("Zipped !");
  } catch (e) {
    console.error(e);
  }
};
