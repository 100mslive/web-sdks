## Web sdks

This monorepo contains all the packages required to integrate 100ms on web

## Before doing any code change please take time to go through the [guidelines](./DEVELOPER.MD) line by line.

### Local Setup

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

Runs eslint across all packages

```
yarn lint
```

### Running Sample Prebuilt

```
# do this at the root level
yarn install
yarn build

cd examples/prebuilt-react-integration
yarn dev
```
You can get a roomCode from [100ms dashboard](https://dashboard.100ms.live) and append at the end

if you want to make changes in a particular package and want to automatically update the above app, navigate to the package and call yarn start
or use the scripts from the top level package.json

### Update a packages version

Run [this](https://github.com/100mslive/web-sdks/actions/workflows/create-release-pr.yml) to
update all versions.


### Publishing Alpha/Experimental versions

To publish an alpha/experimental from your `experimental` branch, run the '[Create Release PR](https://github.com/100mslive/web-sdks/actions/workflows/publish.yml)' action on the `experimental` branch with `prerelease` as input.
This bumps the version of all the packages and creates a PR against your `experimental` branch.

Merge this PR into your `experimental` branch and run the `Publish Packages` workflow on your branch with `alpha` as input to publish the packages.

