/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const dependency in packageJson.peerDependencies) {
  const requiredVersion = packageJson.peerDependencies[dependency];
  try {
    let installedVersion = 0;
    // check if monorepo
    if (fs.existsSync(path.resolve(__dirname, '../../package.json'))) {
      const { workspaces } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
      if (workspaces.length) {
        installedVersion = JSON.parse(
          fs.readFileSync(
            path.resolve(__dirname, `../../node_modules/${dependency.split('/').join('/')}/package.json`),
            'utf8',
          ),
        ).version;
      } else {
        process.exit(0);
      }
    } else {
      installedVersion = JSON.parse(fs.readFileSync(path.resolve(`${dependency}/package.json`))).version;
    }
    if (!require('semver').satisfies(installedVersion, requiredVersion)) {
      console.error(
        `Error: ${dependency} version ${requiredVersion} is required, but version ${installedVersion} is installed.`,
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${dependency} is not installed.`);
    process.exit(1);
  }
}
