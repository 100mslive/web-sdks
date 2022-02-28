## Web sdks

This monorepo will contain all packages related to core sdk and store.

## Before doing any code change please take time to go through the [guidelines](./DEVELOPER.MD) line by line.

### Local Setup

To setup locally, install lerna globally

`npm install -g lerna`

Clone the repo locally and run yarn install

```
git clone https://github.com/100mslive/web-sdks.git
cd web-sdks
yarn install
```

### Test

```
yarn test
```

### Lint

```
yarn lint
```

For starting sdk and store locally, run `yarn start` in both folders.

> Note: run yarn start in sdk first and then in store

### Update a packages version

Go to the path of the package ex: cd packages/hms-video-web and run the following command
`npm version prerelease --preid=alpha --git-tag-version=false`

To update the same in dependent packages run
`lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact`

### Publishing Alpha/Experimental versions

To publish an alpha/experimental from your `experimental` branch, run the 'Create Release PR' action on the `experimental` branch.
This bumps the version of all the packages and creates a PR against your `experimental` branch.

Merge this PR into your `experimental` branch and run the 'Publish Packages' on your branch to publish the packages.

### Syncing with webapp

check the existing remotes with `git remote -v`;
if there is only one remote, add webapp as a new remote.
`git remote add -f webapp https://github.com/100mslive/100ms-web.git`

## push to webapp

`git subtree push --prefix=apps/100ms-web webapp sync-web-app`

## pull from webapp

`git subtree pull --prefix=apps/100ms-web webapp main`

## Tips and Tricks

- `window.toggleUiTheme()` in console to switch between dark and light themes
- Set directJoin to true in PreviewScreen.jsx to not have to click on join after
  page reload.
