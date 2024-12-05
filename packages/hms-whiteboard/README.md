# 100ms Whiteboard

[![Lint, Test and Build](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml/badge.svg)](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/@100mslive/hms-whiteboard)](https://bundlephobia.com/result?p=@100mslive/hms-whiteboard)
[![License](https://img.shields.io/npm/l/@100mslive/hms-whiteboard)](https://www.100ms.live/)
![Tree shaking](https://badgen.net/bundlephobia/tree-shaking/@100mslive/hms-whiteboard)

The 100ms SDK provides robust APIs for integrating whiteboard collaboration into your conferencing sessions. Participants can engage in real-time by drawing, writing, and collaborating on a shared digital whiteboard. This documentation outlines how to implement the start and stop functionality for a whiteboard and display it within an iframe or embed it as a React component.

## Requirements

- React 18 or higher
- Webpack 5 or higher if you're using it to bundle your app
- User roles must be configured to enable whiteboard functionality via the 100ms dashboard for starting or viewing the whiteboard. [Refer here](https://www.100ms.live/docs/get-started/v2/get-started/features/whiteboard#enabling-and-configuring-the-whiteboard).
- If you're on React and are not using the `@100mslive/roomkit-react` package, install the `@100mslive/hms-whiteboard` package.

```bash
yarn add @100mslive/hms-whiteboard
```

## Opening and Closing the Whiteboard

JavaScript users can use the `selectPermissions` selector which fetches the whiteboard specific permissions array from the local peer's role permissions.

React users can check for the `toggle` function returned by the utility hook `useWhiteboard`.

```js
// Vanilla JavaScript Example
import { selectPermissions, selectWhiteboard } from '@100mslive/hms-video-store';

const permissions = hmsStore.getState(selectPermissions)?.whiteboard; // Array<'read' | 'write' | 'admin'>
const isAdmin = !!permissions?.includes('admin');
const whiteboard = hmsStore.getState(selectWhiteboard);
const isOwner = whiteboard?.owner === localPeerUserId;

const toggle = async () => {
    if (!isAdmin) {
        return;
    }

    if (whiteboard?.open) {
        isOwner && (await actions.interactivityCenter.whiteboard.close());
    } else {
        await actions.interactivityCenter.whiteboard.open();
    }
};

// usage
const toggleButton = document.getElementById('toggle-whiteboard');
// non-admin users cannot toggle the whiteboard
toggleButton.disabled = !isAdmin;
toggleButton.onclick = toggle;
```

```jsx
// React Example
import React from 'react';
import { useWhiteboard } from '@100mslive/react-sdk';

export const WhiteboardToggle = () => {
    const { toggle, open, isOwner } = useWhiteboard();

    // non-admin users cannot toggle the whiteboard
    if (!toggle) {
        return null;
    }

    return (
        <Button onClick={toggle} active={!open} disabled={open && !isOwner}>
            Toggle Whitboard
        </Button>
    );
};
```

## Displaying the Collaborative Whiteboard

You can display the whiteboard when it's open by embedding it as an iframe or as a React component for more fine-grained controls, if your app is built using React.

```js
// Vanilla JavaScript Example
import { selectWhiteboard } from '@100mslive/hms-video-store';

const whiteboard = hmsStore.subscribe((whiteboard) => {
    if (whiteboard?.open && whiteboard?.url) {
        const whiteboardIframe = document.createElement('iframe');
        whiteboardIframe.src = whiteboard.url;
    } else {
        const whiteboardIframe = document.getElementById('whiteboard');
        whiteboardIframe?.remove();
    }
}, selectWhiteboard);
```

```jsx
// React Example
import React from 'react';
import { useWhiteboard } from '@100mslive/react-sdk';
import { Whiteboard } from '@100mslive/hms-whiteboard';
import '@100mslive/hms-whiteboard/index.css';

const WhiteboardEmbed = () => {
    const { token, endpoint } = useWhiteboard();

    if (!token) {
        return null;
    }

    return (
        <div style={{ width: '100%', height: '650px' }}>
            <Whiteboard
                token={token}
                endpoint={`https://${endpoint}`}
                onMount={({ store, editor }) => {
                    console.log(store, editor);
                }}
            />
        </div>
    );
};
```

Whiteboard related CSS needs to be imported in your app's top level CSS files using `@import '@100mslive/hms-whiteboard/index.css';`(recommended) or in one of your top level JS file using `import '@100mslive/hms-whiteboard/index.css';`.

Note that if you're using `@100mslive/roomkit-react` you'll need to import `@100mslive/roomkit-react/index.css` accordingly.