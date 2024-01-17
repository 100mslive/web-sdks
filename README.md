## Web sdks

This monorepo contains all the packages required to integrate 100ms on web

## Before doing any code change please take time to go through the [guidelines](./DEVELOPER.MD) line by line.

### Local Setup

> Node version 18.0.0 or later

if you are using a different version in other projects, use [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) to manage node versions.


```
git clone https://github.com/100mslive/web-sdks.git
cd web-sdks
yarn install
yarn build
```

### Running Sample Prebuilt

```
cd examples/prebuilt-react-integration
yarn dev
```

`http://locahost:<port>/<room-code>`

Once you run `yarn dev`, the the localhost link with the port will be generated automatically. Just get the roomCode from [100ms dashboard](https://dashboard.100ms.live) and append at the end


### Testing changes locally
Run `yarn start` by navigating to the package you are making changes to, the changes should reflect in the above sample app.

For example, if you are making changes in roomkit-react(prebuilt), run `yarn start` in that package. The sample app should auto reload.

> Note: Make sure `yarn build` is run atleast once before using `yarn start`