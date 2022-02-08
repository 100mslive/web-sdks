## Web sdks


This monorepo will contain all packages related to core sdk and store.


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

### Syncing with webapp

check the existing remotes with `git remote -v`;
if there is only one remote, add webapp as a new remote.
`git remote add -f webapp https://github.com/100mslive/100ms-web.git`

## push to webapp

`git subtree push --prefix=apps/100ms-web webapp sync-web-app`

## pull from webapp

`git subtree pull --prefix=apps/100ms-web webapp main`
