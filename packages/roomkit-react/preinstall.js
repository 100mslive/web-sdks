/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const dependency in packageJson.peerDependencies) {
  const requiredVersion = packageJson.peerDependencies[dependency];
  try {
    console.log(`\x1b[31m${path.resolve(__dirname, '..')}\x1b[0m`);

    const installedVersion = path.resolve(`${dependency}/package.json`).version;
    if (!require('semver').satisfies(installedVersion, requiredVersion)) {
      console.error(
        `Error: ${dependency} version ${requiredVersion} is required, but version ${installedVersion} is installed.`,
      );
      process.emitWarning(
        `Error: ${dependency} version ${requiredVersion} is required, but version ${installedVersion} is installed.`,
      );
      // process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${dependency} is not installed.`);
    process.emitWarning(`Error: ${dependency} is not installed.`);
    // process.exit(1);
  }
}
