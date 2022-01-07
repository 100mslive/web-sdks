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
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact',
  'lerna add @100mslive/hms-video-store --scope=@100mslive/react-sdk --exact',
  'lerna add @100mslive/react-icons --scope=@100mslive/react-ui --exact',
  // Update deps in webapp
  'lerna add @100mslive/react-ui --scope=100ms_edtech_template --exact',
  'lerna add @100mslive/react-sdk --scope=100ms_edtech_template --exact',
  'lerna add @100mslive/react-icons --scope=100ms_edtech_template --exact',
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
  }, {});
}

const execPromise = cmd => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, out) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(out);
    });
  });
};

/**
 * figure out packages which need version update for the changes in this PR and update the version properly if it's not already updated.
 * The already updated part we figure out by comparing the version to the version of that package in main branch.
 */
module.exports = async ({ github, context, core }) => {
  const { CHANGES } = process.env;
  const changedPackages = JSON.parse(CHANGES);

  const packagesToBeUpdated = new Set();

  for (const pkgName in changedPackages) {
    if (changedPackages[pkgName] === 'true') {
      (dependencyMapping[pkgName] || []).forEach(pkg => packagesToBeUpdated.add(pkg));
    }
  }

  const currentVersions = getVersionMap();
  await execPromise('git checkout main');
  const mainVersions = getVersionMap();
  for (const key in currentVersions) {
    if (currentVersions[key] !== mainVersions[key]) {
      packagesToBeUpdated.delete(key); // Already updated delete from to be updated list
    }
  }
  const branch = context.ref.split('refs/heads/')[1];
  await execPromise(`git checkout ${branch}`);
  for (const value of packagesToBeUpdated.values()) {
    const location = path.resolve(`packages/${value}`);
    await execPromise(`cd ${location}; npm version prerelease --preid=alpha --git-tag-version=false`);
  }

  lernaCommands.forEach(cmd => {
    exec(cmd, function (err, out) {});
  });

  await execPromise(`yarn install`);
  await execPromise(`git commit -am 'build: update versions' || echo 'no changes'`);
  await execPromise(`git push origin ${branch}`);
};
