# Room Kit React Library

100ms Room Kit provides simple & easy to use UI components to build Live Streaming & Video Conferencing experiences in your apps.

## Installation

```
// npm
npm install @100mslive/roomkit-react@latest --save

// yarn
yarn add @100mslive/roomkit-react@latest
```

## Usage

#### Using room code

```jsx
import { HMSPrebuilt } from '@100mslive/roomkit-react'

export default App() {
    return (
        <HMSPrebuilt roomCode={<room-code>} />
    );
}
```

#### Using authToken

```jsx
import { HMSPrebuilt } from '@100mslive/roomkit-react'

export default App() {
    return (
        <HMSPrebuilt authToken={<auth-token>} />
    );
}



Prebuilt customisations are available on [100ms dashboard](https://dashboard.100ms.live)
