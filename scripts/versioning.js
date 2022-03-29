/* eslint-disable complexity */
const { dependencyMapping } = require('./constants');
/**
 * lerna add will update the passed in package's version in the scoped package
 * lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact
 * will update @100mslive/hms-video version in @100mslive/hms-video-store.
 * --exact use exact version instead of ^ prefix.
 * */
const lernaCommands = [
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact || echo "No changes"',
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-noise-suppression --dev --exact || echo "No changes"',
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-noise-suppression --peer || echo "No changes"',
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-virtual-background --dev --exact || echo "No changes"',
  'lerna add @100mslive/hms-video --scope=@100mslive/hms-virtual-background --peer || echo "No changes"',
  'lerna add @100mslive/hms-video-store --scope=@100mslive/react-sdk --exact || echo "No changes"',
  'lerna add @100mslive/react-icons --scope=@100mslive/react-ui --exact || echo "No changes"',
  'lerna add @100mslive/react-sdk --scope=@100mslive/react-ui --exact || echo "No changes"',
  // Update deps in webapp
  'lerna add @100mslive/react-ui --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/react-sdk --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/react-icons --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/hms-virtual-background --scope=100ms_edtech_template --exact || echo "No changes"',
  'lerna add @100mslive/hms-noise-suppression --scope=100ms_edtech_template --exact || echo "No changes"',
];

const exec = require('child_process').exec;
const path = require('path');

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
module.exports = async () => {
  const { changes, mainVersions: main, currentVersions: current, branch } = process.env;
  const changedPackages = JSON.parse(changes);
  const mainVersions = JSON.parse(main);
  const currentVersions = JSON.parse(current);

  console.log({ mainVersions, currentVersions, changedPackages });
  const packagesToBeUpdated = new Set();
  for (const pkgName in changedPackages) {
    if (changedPackages[pkgName] === 'true') {
      (dependencyMapping[pkgName] || []).forEach(pkg => packagesToBeUpdated.add(pkg));
    }
  }
  for (const pkg in currentVersions) {
    if (currentVersions[pkg] !== mainVersions[pkg]) {
      packagesToBeUpdated.delete(pkg); // Already updated delete from to be updated list
    }
  }
  console.log('packagesToBeUpdated', packagesToBeUpdated.values());
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
