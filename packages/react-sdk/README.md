### About

This package is a react wrapper over the core SDK(`@100mslive/hms-video-store`). 
An easy way to use the store, actions and notifications are provided via
React hooks. 
Some other hooks are also provided for ease of use which wrap
over the primitive ones.
If someone is using class based react components, they'll be better off
with using the core sdk directly.

### Installation

```
// npm
npm install @100mslive/react-sdk@latest --save

// yarn
yarn add @100mslive/react-sdk@latest
```

### Usage
Add `HMSRoomProvider` from `@100mslive/react-sdk` at the top level of your component tree where you want to use the hooks. Wihout this the hooks will throw an error.

```
<HMSRoomProvider>
   <YourComponent></YourComponent>
</HMSRoomProvider>
```

By default, when using `HMSRoomProvider` room leave will be called when you are leaving/closing the tab.
To disable this behaviour, you can pass `leaveOnUnload` as `false`

> NOTE: The above leave might or might not be successfully sent to server as it depends on the browser implementation. This works on chromium based browsers.



### Primitive Hooks

These are hooks wrapper over the sdk things.

- useHMSStore - to get any state from store
- useHMSActions - hmsActions to perform any actions
- useHMSNotifications - to receive any new notifications/error for the room
- useHMSVanillaStore - return the store object directly to be used in non react context
- useHMSStatsStore - to get webrtc related stats


### Helpful Hooks

- useVideo - attaching and detaching video based on trackId
- useVideoList - helpful to build a paginated gallery view of video tiles
- useScreenShare - to toggle screenshare
- useCustomEvent - to add [custom events](https://www.100ms.live/docs/javascript/v2/features/chat#custom-events)
- useDevices - returns a list of all A/V devices
- useParticipants - get count of participants, participants filtered by role or metadata
- usePreviewJoin - implementing preview + join
- useAVToggle - to toggle mute/unmute for audio and video
- useRemoteAVToggle - to toggle remote mute/unmute + audio volume changer on tile level
- useAutoplayError - unblock browser autoplay block
- useAudioLevelStyles - apply css properties on element based on it's audio level

Refer to [docs](https://www.100ms.live/docs/javascript/v2/quickstart/react-quickstart) for a more detailed guide. 
