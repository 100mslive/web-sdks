### About

This package holds the code for the react wrapper over the core SDK. 
An easy way to use the store, actions and notifications are provided via
React hooks. Some other hooks are also provided for ease of use which wrap
over the primitive ones.
If someone is using class based react components, they'll be better off
with using the core sdk directly.

> If you're already using hooks from hms-video-react, this package will be a drop
> in replacement. hms-video-react is planned to be deprecated so please move your code
> to using this package instead.

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