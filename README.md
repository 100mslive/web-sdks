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

## Updating Package versions

- Whenever sdk is updated, store needs to be updated as well, as sdk is direct dependency for store now.
  The following command will update sdk version, store version and sdk version in store.
  `lerna version prerelease --no-git-tag-version --yes --exact`

- if sdk version is automatically updated by github workflow(this will be gradually updated to do the above)
  Run the following command to update store version and sdk version in store.
  `lerna add @100mslive/hms-video --scope=@100mslive/hms-video-store --exact` - will update sdk version in store
  `npm version prerelease --preid alpha` - This will update store version

## Linking to webapp

- Run `yarn link` in `packages/hms-video-store`.
- Then use the linked package in react repo and then link react to webapp.
- If react app is not necessary, you can try linking store directly in webapp but linking in react is preferred.
