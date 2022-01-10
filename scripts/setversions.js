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
  if (!versions) {
    core.exportVariable('versions', JSON.stringify(currentVersions));
    return;
  }
  core.exportVariable('currentVersions', JSON.stringify(currentVersions));
  core.exportVariable('mainVersions', versions);
};
