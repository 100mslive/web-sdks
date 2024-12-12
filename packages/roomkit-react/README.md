![Banner](https://github.com/100mslive/web-sdks/blob/06c65259912db6ccd8617f2ecb6fef51429251ec/prebuilt-banner.png)

[![Lint, Test and Build](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml/badge.svg)](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/@100mslive/roomkit-react)](https://bundlephobia.com/result?p=@100mslive/roomkit-react)
[![License](https://img.shields.io/npm/l/@100mslive/roomkit-react)](https://www.100ms.live/)
![Tree shaking](https://badgen.net/bundlephobia/tree-shaking/@100mslive/roomkit-react)

# Room Kit React Library

100ms Room Kit provides simple & easy to use UI components to build Live Streaming & Video Conferencing experiences in your apps.

## Installation

```bash
// npm
npm install @100mslive/roomkit-react@latest --save

// yarn
yarn add @100mslive/roomkit-react@latest
```

## Usage

### Using room code

```jsx
import { HMSPrebuilt } from '@100mslive/roomkit-react'

export default App() {
    return (
        <HMSPrebuilt roomCode={<room-code>} />
    );
}
```

### Using authToken

```jsx
import { HMSPrebuilt } from '@100mslive/roomkit-react'

export default App() {
    return (
        <HMSPrebuilt authToken={<auth-token>} />
    );
}
```

For additional props, refer the [docs](https://www.100ms.live/docs/javascript/v2/quickstart/prebuilt-quickstart#props-for-hmsprebuilt)

## Customisation

While we offer [a no-code way to customize Prebuilt](https://www.100ms.live/docs/get-started/v2/get-started/prebuilt/overview#customize-prebuilt), you can fork your copy of the Prebuilt component and make changes to the code to allow for more fine-tuning.

Prebuilt customisations are available on [100ms Dashboard](https://dashboard.100ms.live).

### Understanding the Structure

The `src` folder contains all the components, `Button`, `Accordion` etc.
The `Prebuilt` folder contains the full Prebuilt implementation.
`App.tsx` is the entry point for the Prebuilt which contains the `HMSPrebuilt` component.

### Major Components in Prebuilt

| Component                                                                | Description                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [RoomLayoutProvider](src/Prebuilt/provider/roomLayoutProvider/index.tsx) | This is a context that contains the configuration from the dashboard [customiser](https://dashboard.100ms.live/). Whatever changes are made in the dashboard customiser are available the next time you join.                          |
| [AppStateContext](src/Prebuilt/AppStateContext.tsx)                      | Contains the logic to switch between different screens, for example, Preview to Meeting, Meeting to Leave. These transitions are based on the roomState that is available from the reactive store (`useHMSStore(selectHMSRoomState)`). |
| [PreviewScreen](src/Prebuilt/components/Preview/PreviewScreen.tsx)       | Contains the Preview implementation. Contains the Video tile, video, audio toggles and Virtual background and settings along with the name input.                                                                                      |
| [ConferenceScreen](src/Prebuilt/components/ConferenceScreen.tsx)         | This contains the screen once you finish Preview and enter the meeting. This contains the header and footer and the main content.                                                                                                      |
| [VideoStreamingSection](src/Prebuilt/layouts/VideoStreamingSection.tsx)  | This is the component that contains the main video rendering components and a sidebar (Interactive features like Chat and Polls are displayed here)                                                                                    |
| [LeaveScreen](src/Prebuilt/components/LeaveScreen.tsx)                   | This is the screen that is shown when you leave the meeting                                                                                                                                                                            |

### Customising the Styles

[Base Config](./src/Theme/base.config.ts) has all the variables that you can use. Any changes you want for the theme can be made here. Most likely no additional changes will be required unless you want to introduce new variables.

When [`HMSThemeProvider`](./src/Theme/ThemeProvider.tsx) is used at the top level, all the variables will be available for all the children under this component tree.

For components created using the base components like `Box`, `Flex`, `Button` etc, css Prop is available to modify the styles. Within the css prop, you can access the variables from the [base config](./src/Theme/base.config.ts).

## Contributing

- Make sure whatever new Component/file you create is in `Typescript`.

- Don't forget to add data-testid for actionables like buttons, menus etc.

- Setup proper tooling ([ESLint](https://eslint.org/) and [Prettier](https://prettier.io/)) in your editor.

- `yarn lint` will be run before you push the changes, so whenever a push fails, check if there are any lint errors.

Read this [doc](../../DEVELOPER.MD) for the coding guidelines.

## Community & Support

- [GitHub Issues](https://github.com/100mslive/web-sdks/issues) - Submit any bugs or errors you encounter using the Web SDKs.
- [Dashboard](https://dashboard.100ms.live/dashboard) - ask questions to get help from the 100ms team.
- [Contact](https://www.100ms.live/contact) - Reach out to 100ms team to get pricing information, understand how we can help you go live, or to learn more about the platform.
