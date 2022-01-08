const dependencyMapping = {
  'hms-video-web': ['hms-video-web', 'hms-video-store', 'react-sdk', 'react-ui'],
  'hms-video-store': ['hms-video-store', 'react-sdk', 'react-ui'],
  'react-sdk': ['react-sdk'],
  'react-icons': ['react-icons', 'react-ui'],
  'react-ui': ['react-ui'],
};

/**
 * lerna add will update the passed in package's version in the scoped package
 * lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact
 * will update @100mslive/hms-video version in @100mslive/hms-video-store.
 * --exact use exact version instead of ^ prefix.
 * */
const lernaCommands = [
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact || echo "No changes"',
  'lerna add @100mslive/hms-video-store --scope=@100mslive/react-sdk --exact || echo "No changes"',
  'lerna add @100mslive/react-icons --scope=@100mslive/react-ui --exact || echo "No changes"',
  // Update deps in webapp
  'lerna add @100mslive/react-ui --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/react-sdk --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/react-icons --scope=100ms_edtech_template --exact || echo "No changes"',
];

const exec = require('child_process').exec;
const path = require('path');

/**
 * Get versions of all packages
 * @returns {}
 */
function getVersionMap() {
  return Object.keys(dependencyMapping).reduce((pkgVersions, pkgName) => {
    const location = path.resolve(`packages/${pkgName}`);
    const version = require(`${location}/package.json`).version;
    pkgVersions[pkgName] = version;
    return pkgVersions;
  }, {});
}

const execPromise = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, out) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(out);
      resolve(out);
    });
  });
};

/**
 * figure out packages which need version update for the changes in this PR and update the version properly if it's not already updated.
 * The already updated part we figure out by comparing the version to the version of that package in main branch.
 */
module.exports = async ({ context }) => {
  const { CHANGES, branch } = process.env;
  const changedPackages = JSON.parse(CHANGES);

  const packagesToBeUpdated = new Set();

  for (const pkgName in changedPackages) {
    if (changedPackages[pkgName] === 'true') {
      (dependencyMapping[pkgName] || []).forEach(pkg => packagesToBeUpdated.add(pkg));
    }
  }
  console.log('packagesToBeUpdated', packagesToBeUpdated.values());
  const currentVersions = getVersionMap();
  await execPromise('git checkout main');
  const mainVersions = getVersionMap();
  console.log({ mainVersions, currentVersions });
  for (const pkg in currentVersions) {
    if (currentVersions[pkg] !== mainVersions[pkg]) {
      packagesToBeUpdated.delete(pkg); // Already updated delete from to be updated list
    }
  }
  console.log('packagesToBeUpdated', packagesToBeUpdated.values());
  await execPromise(`git checkout ${branch}`);
  for (const value of packagesToBeUpdated.values()) {
    const location = path.resolve(`packages/${value}`);
    await execPromise(`cd ${location}; npm version prerelease --preid=alpha --git-tag-version=false`);
  }

  for (const cmd of lernaCommands) {
    await execPromise(cmd);
  }
  await execPromise(`git commit -am 'build: update versions' || echo 'no changes'`);
  await execPromise(`git push origin ${branch}`);
};
