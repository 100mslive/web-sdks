const { dependencyMapping } = require('./constants');
const path = require('path');

module.exports = ({ core, name }) => {
  console.log(JSON.stringify(process.env));
  console.log(core);
  const versions = Object.keys(dependencyMapping).reduce((pkgVersions, pkgName) => {
    const location = path.resolve(`packages/${pkgName}`);
    const version = require(`${location}/package.json`).version;
    pkgVersions[pkgName] = version;
    return pkgVersions;
  }, {});
  core.exportVariable(name, JSON.stringify(versions));
};
