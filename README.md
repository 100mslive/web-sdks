# Web SDKs

This monorepo contains all the packages required to integrate 100ms on the web.

## Contributing
We welcome external contributors or anyone excited to help improve 100ms SDKs. If you'd like to get involved, check out our [contribution guide](./DEVELOPER.MD), and get started exploring the codebase.

Please join us [on Discord](https://discord.com/invite/kGdmszyzq2) to discuss any new ideas and/or PRs.

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

## Understanding the Packages
The packages folder contains all the SDK's of 100ms. Here is a brief overview of them.
| Directory | Package | Description | Link |
|--|--|--|--|
| `hms-video-store`  | `@100mslive/hms-video-store` | This package contains the core SDK and the reactive store parts.  | [README](https://github.com/100mslive/web-sdks/blob/main/packages/hms-video-store/README.md) |
| `react-icons`  | `@100mslive/react-icons` | This contains all the icons used in the 100ms prebuilt.  | [README](https://github.com/100mslive/web-sdks/blob/main/packages/react-icons/README.md) |
| `react-sdk` | `@100mslive/react-sdk` | This contains the base React Hooks and some commonly used functionalities as React Hooks. | [README](https://github.com/100mslive/web-sdks/blob/main/packages/react-sdk/README.md) |

For full documentation, visit [100ms.live/docs](https://www.100ms.live/docs)

### 100ms Prebuilt
![Banner](https://github.com/adityathakurxd/web-sdks/assets/53579386/cd9a4d3f-0ebf-4f20-ae9a-1ae4ad0308c5)

100ms Prebuilt is a high-level abstraction that enables you to embed video conferencing and/or live streaming UI—with a few lines of code. It abstracts out nuances regarding audio/video integration which enables your end-users to get reliable live video without the hassles of integration.

| Directory | Package | Description | Link |
|--|--|--|--|
| `roomkit-react`  | `@100mslive/roomkit-react`| This contains the React components used in the prebuilt and the Prebuilt component itself.  | [README](https://github.com/100mslive/web-sdks/blob/main/packages/roomkit-react/README.md) |
| `roomkit-web` | `@100mslive/roomkit-web` | This is a web component port of the `HMSPrebuilt` component from the `roomkit-react`. If you are not using React,this can be used as a web component. | [README](https://github.com/100mslive/web-sdks/blob/main/packages/roomkit-web/README.md)|

For full documentation, visit [100ms.live/docs/prebuilt/v2/prebuilt/quickstart](https://www.100ms.live/docs/prebuilt/v2/prebuilt/quickstart)


## Other SDKs
| Client | Repository | Documentation |
|--|--|--|
| Android | [100ms-android](https://github.com/100mslive/100ms-android/tree/release-v2/room-kit) | [Link](https://www.100ms.live/docs/android/v2/quickstart/quickstart)
| iOS | [100ms-ios-sdk](https://github.com/100mslive/100ms-ios-sdk) | [Link](https://www.100ms.live/docs/ios/v2/quickstart/quickstart)
| Prebuilt iOS | [100ms-roomkit-ios](https://github.com/100mslive/100ms-roomkit-ios) | [Link](https://www.100ms.live/docs/ios/v2/quickstart/prebuilt)
| Flutter | [100ms-flutter](https://github.com/100mslive/100ms-flutter/tree/main/packages/hms_room_kit)| [Link](https://www.100ms.live/docs/flutter/v2/quickstart/quickstart)
| React Native | [100ms-react-native](https://github.com/100mslive/100ms-react-native/tree/main/packages/react-native-room-kit)| [Link](https://www.100ms.live/docs/react-native/v2/quickstart/quickstart)

## Community & Support

-   [GitHub Issues](https://github.com/100mslive/web-sdks/issues) - Submit any bugs or errors you encounter using the Web SDKs.
-   [Discord](https://discord.com/invite/kGdmszyzq2) - Hang out with the community members, share your projects or ask questions to get help from the 100ms team.
-   [Contact](https://www.100ms.live/contact) - Reach out to 100ms team to get pricing information, understand how we can help you go live, or to learn more about the platform.
