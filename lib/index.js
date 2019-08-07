const AdmZip = require("adm-zip");

const zip = new AdmZip();

exports.formatMap = args => {
  const pathArg = args.findIndex(arg => arg === "--path");
  const outputArg = args.findIndex(arg => arg === "--output");

  const hasAllRequiredArgsDefined = [pathArg, outputArg].every(arg => arg > -1);

  if (!hasAllRequiredArgsDefined) {
    throw "Required args: path, output";
  }

  return {
    path: args[pathArg + 1],
    output: args[outputArg + 1]
  };
};

exports.main = map => {
  try {
    zip.addLocalFolder(map.path);
    zip.toBuffer();
    zip.writeZip(map.output);

    console.log("Zipped !");
  } catch (e) {
    console.error(e);
  }
};
