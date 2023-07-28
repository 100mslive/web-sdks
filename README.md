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

### Running playwright tests

Navigate to playwright directory before running below commands.

## Install packages

```
yarn install 
```

## Run for say qa-in

```
 yarn qa-in
```

### Lint

```
yarn lint
```

### Running dev server

Run whatever things you're changing in below in different terminal instances. For other packages you can navigate to
the folder directly and run `yarn start`.

```
# for webapp
> yarn app

# for hms-video-web
> yarn sdk

# for hms-video-store
> yarn store

# for react-sdk
> yarn reactsdk

```

> Note: run yarn start in sdk first and then in store

### Custom App in Dev

This is useful when you want to see changes from `100ms-web` app being reflected in custom app in dev. Run `yarn dev` in `100ms-web` & `yarn start` in `custom-app`

### Update a packages version

Run [this](https://github.com/100mslive/web-sdks/actions/workflows/create-release-pr.yml) to
update all versions.

#### Updating single ones

Go to the path of the package ex: cd packages/hms-video-web and run the following command
`npm version prerelease --preid=alpha --git-tag-version=false`

To update the same in dependent packages run
`lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact`

### Publishing Alpha/Experimental versions

To publish an alpha/experimental from your `experimental` branch, run the '[Create Release PR](https://github.com/100mslive/web-sdks/actions/workflows/publish.yml)' action on the `experimental` branch.
This bumps the version of all the packages and creates a PR against your `experimental` branch.

Merge this PR into your `experimental` branch and run the 'Publish Packages' on your branch to publish the packages.

### Syncing with webapp

check the existing remotes with `git remote -v`;
if there is only one remote, add webapp as a new remote.
`git remote add -f webapp https://github.com/100mslive/100ms-web.git`

## push to webapp

`git subtree push --prefix=apps/100ms-web webapp sync-webapp`

## pull from webapp

`git subtree pull --prefix=apps/100ms-web webapp main`

## Adding a new repo into the monorepo

**To add an existing repo**

`git clone <repourl>`

- if commit history is not need directly copy the files.
  `cd repo`
  `rm -rf .git`
  `git rm -r --cached`
  `cp -r repo path-to-web-sdks/packages`
- if commit history is needed
  `lerna import path-to-repo --flatten --preserve-commit` (to be run at root level)

**To Create a new repo**

Follow the documentation [here](https://github.com/lerna/lerna/tree/main/commands/create#readme)

> Note: Don't forget to update mapping in `scripts/constants.js`. Also update`lernaCommands` in `versioning.js` depending on the new repo's dependencies and dependents

## Setup Cypress

- Create a .env file to the root folder and add the following variables.

```
CYPRESS_TOKEN_ENDPOINT=https://qa-in2.100ms.live/hmsapi/ravi.qa-app.100ms.live/api/token
CYPRESS_ROOM_ID=60f26ab342a997a1ff49c5c2
CYPRESS_ROLE=student
CYPRESS_API_ENV=qa
CYPRESS_INIT_ENDPOINT=https://qa-init.100ms.live/init
```

- Run `yarn cypress:open` at the root level to open the cypress app.

## Tips and Tricks

- `window.toggleUiTheme()` in console to switch between dark and light themes
- Set directJoin to true in PreviewScreen.jsx to not have to click on join after
  page reload.
