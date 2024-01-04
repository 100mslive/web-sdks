## Web sdks

This monorepo contains all the packages required to integrate 100ms on web

## Before doing any code change please take time to go through the [guidelines](./DEVELOPER.MD) line by line.

### Local Setup

To setup locally, install lerna globally

`npm install -g lerna@5`

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

Runs eslint across all packages

```
yarn lint
```

### Running dev server

Run whatever things you're changing in below in different terminal instances. For other packages you can navigate to
the folder directly and run `yarn start`.

```
# for hms-video-store
> yarn store

# for react-sdk
> yarn reactsdk

# for roomkit-react
> yarn prebuilt

```

### Update a packages version

Run [this](https://github.com/100mslive/web-sdks/actions/workflows/create-release-pr.yml) to
update all versions.


### Publishing Alpha/Experimental versions

To publish an alpha/experimental from your `experimental` branch, run the '[Create Release PR](https://github.com/100mslive/web-sdks/actions/workflows/publish.yml)' action on the `experimental` branch with `prerelease` as input.
This bumps the version of all the packages and creates a PR against your `experimental` branch.

Merge this PR into your `experimental` branch and run the `Publish Packages` workflow on your branch with `alpha` as input to publish the packages.

