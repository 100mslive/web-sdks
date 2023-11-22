## Architecture

Below are the major components of the sdk, segregated usually in folders.

### sdk/index.ts

The entry point and the orchestrator. This is where the public API is exposed,
it acts as the central controller managing other pieces and injecting dependencies
to different objects as required.

### Analytics

Responsbile for all analytics related things which at the moment is sending failure
events which shows up in amplitude.

### Device Manager

Responsible for handling device changes. Updates the devices list once the permissions are given, also
updates the tracks(audio/video) whenever a corresponding device is added or removed. It also handles the logic
of selecting correct output device device when a new device is added or removed.

### Audio Sink Manager

Responsible for handling of playing remote audio. This is connected to Notification Manager to listen to track add/remove events
and play the corresponding track by creating/removing audio elements.
Browsers autoplay handling is also done here. Whenever the browser blocks autoplay, it throws an error and provides a way for the
UI to unblock the audio. Some browsers(eg: Firefox) pause the tracks when headphones are connected. This handling autoplaying those
tracks as well.

### Signal

Handles the signalling part of [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling).
Currently, it connects to biz through JSON RPC over websocket. Signalling is responsible for-

- [offer answer exchange](https://webrtcforthecurious.com/docs/02-signaling/)
- syncing metadata and state for peers and tracks(mute, unmute etc.)
- broadcast, sending/receiving messages
- policy and role details describing permissions and capabilities of each role
- sending request or forcibly changing remote peer's state - mute/unmute, role-change
- sending analytics event from client

### Notification Manager

Handles incoming messages from biz(signalling server) and sfu(WebRTC server).
Examples of messages coming over biz

- Peer List and Room state
- Peer add remove
- Track add remove
- Private and Broadcast messages
- Policy change messages
- Requests for track mute/unmute, role change etc.

Message coming over sfu

- Peer audio level for active speaker

Notification Manager is split into multiple parts dealing with individual areas. For
e.g. PeerListManager, TrackManager etc.

### RTC Stats

Webrtc internals stats.

### Subscribe Degradation

Takes care of degrading videos when there is not enough bandwith.

### Transport

Managing signalling, and updates coming from signalling server as well as SFU.

### Connection

Core WebRTC connection, offer, answer and control of the native peer connection.

### Playlist

Handles playing audio and video files from url and streaming to the other side.
This is supported by PlaylistManager, PlaylistAudioManager, PlaylistVideoManager and AudioContextManager.
PlaylistAudioManager handles creating audio elements and handling progress, ended events.
PlaylistVideoManager handles creating video elements and handling progress, ended events.
Video is captured by rendering each frame on to a canvas and getting the track from canvas and sending it
to all peers in the room.
AudioContextManager handles getting the audio track for both audio and video. It creates an AudioContext
with audio/video element as source and provides an audio track which is then sent to all peers in the room.
PlaylistManager is where all the above are created and used depending on the playlistType(audio/video) that is passed.
It also updates the store/UI with the necessary events like ended, progress, newtrackstart etc. Also allows to control
playbackrate, volume, seek to a position on the corresponding playlistType.

### Plugins

Handles support for custom audio and video plugins. These plugins are synonymous to
HTTP filters from the API world. They hook into the processing pipeline for audio and video
and can modify them before they're sent to the remote peers. This allows for
possibilities like applying filters, virtual background, noise reduction, artistic effects etc.


## VideoElementManager

Handles rendering of video track provided video elements. it keeps track of the video elements and attaches/detaches video when it
is in view or out of view(This was earlier done in react-sdk, but is now part of the core sdk). A flag provided at the run time controls whether this is enabled. Every HMSVideoTrack has its own VideoElementManager which stores a reference to the video element(s) it's attached to. The class takes care of primarily two things - 
- Video subscription using [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - ensures that only visible video elements are subscribed to, to save on bandwidth and device resources(video decoding is cpu heavy)
- Rendering the proper resolution using [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) - In case of Simulcast, there are multiple layers which can be subscribed to. The class is responsible for figuring out the dimensions of the video element rendering the video and picking the appropriate layer.
