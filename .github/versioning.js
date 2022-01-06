const dependencyMapping = {
  'hms-video-web': ['hms-video-web', 'hms-video-store', 'react-sdk', 'react-ui'],
  'hms-video-store': ['hms-video-store', 'react-sdk', 'react-ui'],
  'react-sdk': ['react-sdk'],
  'react-icons': ['react-icons', 'react-ui'],
  'react-ui': ['react-ui'],
};

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

function getVersionMap() {
  Object.keys(dependencyMapping).reduce((acc, value) => {
    const location = path.resolve(`packages/${value}`);
    const version = require(`${location}/package.json`).version;
    acc[value] = version;
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

module.exports = async ({ github, context, core }) => {
  const { CHANGES } = process.env;
  const changes = JSON.parse(CHANGES);

  const packagesToBeUpdated = new Set();

  for (const key in changes) {
    if (changes[key] === 'true') {
      (dependencyMapping[key] || []).forEach(value => packagesToBeUpdated.add(value));
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
};
