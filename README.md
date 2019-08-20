# Lasyde

Simple CLI to package and tag a lambda function.

## Installation

`npm i lasyde -g`

## How to use

In your Lambda folder, add a config file:

```
//lasyde.config.json
{
    "<some-name>": {
      "src": "<path-to-code-folder>",
      "key": "<some-s3-key>",
      "file": "file.zip",
      "functionName": "<function-name>",
      "aliases": {
        "dev": "$LATEST",
        "prod": "<some-version>",
        "other-alias": "fixed@update"
      },
      "bucket": "<your-bucket>",
      // Optional
      "prune": <int>
  }
}
```

Then, in the folder, run the following command:

`lasyde deploy --target <some-name> --alias <your-alias>`
