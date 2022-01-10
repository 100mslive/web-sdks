const { dependencyMapping } = require('./constants');
const path = require('path');

module.exports = ({ core }) => {
  const { versions } = process.env;
  const currentVersions = Object.keys(dependencyMapping).reduce((pkgVersions, pkgName) => {
    const location = path.resolve(`packages/${pkgName}`);
    const version = require(`${location}/package.json`).version;
    pkgVersions[pkgName] = version;
    return pkgVersions;
  }, {});

  // Verions is not present when the script is run for main branch
  if (!versions) {
    core.exportVariable('versions', JSON.stringify(currentVersions));
    return;
  }
  core.exportVariable('currentVersions', JSON.stringify(currentVersions));
  // versions from main will also have to be exported from here
  core.exportVariable('mainVersions', versions);
};
