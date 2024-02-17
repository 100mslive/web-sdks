
# Web SDKs

This monorepo contains all the packages required to integrate 100ms on the web. 

## What is included?
The packages folder contains all the SDK's of 100ms. Here is a brief overview of them:
| Directory | Package | Description | Link |
|--|--|--|--|
| `hms-video-store`  | `@100mslive/hms-video-store` | This package contains the core SDK and the reactive store parts.  | [README](./packages/hms-video-store) |
| `react-icons`  | `@100mslive/react-icons` | This contains all the icons used in the 100ms prebuilt.  | [README](./packages/react-icons) |
| `react-sdk` | `@100mslive/react-sdk` | This contains the base React Hooks and some commonly used functionalities as React Hooks. | [README](./packages/react-sdk) |
| `roomkit-react`  | `@100mslive/roomkit-react`| This contains the React components used in the Prebuilt and the Prebuilt component itself.  | [README](./packages/roomkit-react) |
| `roomkit-web` | `@100mslive/roomkit-web` | This is a web component port of the `HMSPrebuilt` component from the `roomkit-react`. If you are not using React,this can be used as a web component. | [README](./packages/roomkit-web)|

For full documentation, visit [100ms.live/docs](https://www.100ms.live/docs)

<br>

## How to integrate?
The 100ms SDK gives you everything you need to build scalable, high-quality live video and audio experiences. 

**There are two ways you can add 100ms to your apps:**

1. ## Custom UI
	-	100ms SDKs are powerful and highly extensible to build and support all custom experiences and UI.
	-	**Related packages include:** `@100mslive/react-sdk`, `@100mslive/hms-video-store` and `@100mslive/react-icons`.
	-	Get started with integrating the SDK using the [How to Guide](https://www.100ms.live/docs/javascript/v2/how-to-guides/install-the-sdk/integration). <br>

> Navigate to `react-sdk` for the base React Hooks and some commonly used functionalities by clicking [here](./packages/react-sdk).

2.  ## 100ms Prebuilt 
	- 100ms Prebuilt is a high-level abstraction with no-code customization that enables you to embed video conferencing and/or live streaming UI—with a few lines of code.
	- **Related packages include:** `roomkit-react` and `roomkit-web`.
	- Get started with 100ms Prebuilt using the [Prebuilt Quickstart for Web](https://www.100ms.live/docs/javascript/v2/quickstart/prebuilt-quickstart). <br>

> Navigate to `roomkit-react` for the React components used in Prebuilt and the Prebuilt component itself by clicking [here](./packages/roomkit-react).

<hr>

![Banner](prebuilt-banner.png)


###  100ms Prebuilt Cross Platform Support
| Client | Repository | Docs | Example |
|--|--|--|--|
| Web | [web-sdks](https://github.com/100mslive/web-sdks/tree/main/packages/roomkit-react) | [Link](https://www.100ms.live/docs/javascript/v2/quickstart/prebuilt-quickstart) | [prebuilt-react-integration](https://github.com/100mslive/web-sdks/tree/main/examples/prebuilt-react-integration)
| Android | [100ms-android](https://github.com/100mslive/100ms-android/tree/release-v2/room-kit) | [Link](https://www.100ms.live/docs/android/v2/quickstart/prebuilt-android) | [AndroidPrebuiltDemo](https://github.com/100mslive/AndroidPrebuiltDemo)
| iOS | [100ms-roomkit-ios](https://github.com/100mslive/100ms-roomkit-ios) | [Link](https://www.100ms.live/docs/ios/v2/quickstart/prebuilt) | [100ms-roomkit-example](https://github.com/100mslive/100ms-roomkit-example)
| Flutter | [100ms-flutter](https://github.com/100mslive/100ms-flutter/tree/main/packages/hms_room_kit)| [Link](https://www.100ms.live/docs/flutter/v2/quickstart/prebuilt) | [hms_room_kit/example](https://github.com/100mslive/100ms-flutter/tree/main/packages/hms_room_kit/example)
| React Native | [100ms-react-native](https://github.com/100mslive/100ms-react-native/tree/main/packages/react-native-room-kit)| [Link](https://www.100ms.live/docs/react-native/v2/quickstart/prebuilt) | [react-native-room-kit/example](https://github.com/100mslive/100ms-react-native/tree/main/packages/react-native-room-kit/example)


<hr>
<br>

## Setup

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

Once you run `yarn dev`, the localhost link with the port will be generated automatically. Just get the roomCode from [100ms dashboard](https://dashboard.100ms.live) and append at the end


### Testing Changes Locally
Run `yarn start` by navigating to the package you are making changes to, the changes should reflect in the above sample app.

For example, if you are making changes in roomkit-react(prebuilt), run `yarn start` in that package. The sample app should auto reload.

> Note: Make sure `yarn build` is run atleast once before using `yarn start`


<br>

## Contributing
We welcome external contributors or anyone excited to help improve 100ms SDKs. If you'd like to get involved, check out our [contribution guide](./DEVELOPER.MD), and get started exploring the codebase.

Please join us [on Discord](https://discord.com/invite/kGdmszyzq2) to discuss any new ideas and/or PRs.

<br>

## Community & Support

-   [GitHub Issues](https://github.com/100mslive/web-sdks/issues) - Submit any bugs or errors you encounter using the Web SDKs.
-   [Discord](https://discord.com/invite/kGdmszyzq2) - Hang out with the community members, share your projects or ask questions to get help from the 100ms team.
-   [Contact](https://www.100ms.live/contact) - Reach out to 100ms team to get pricing information, understand how we can help you go live, or to learn more about the platform.
