# 100ms HLS Player

[![Lint, Test and Build](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml/badge.svg)](https://github.com/100mslive/web-sdks/actions/workflows/lint-test-build.yml)
[![Bundle Size](https://badgen.net/bundlephobia/minzip/@100mslive/hls-player)](https://bundlephobia.com/result?p=@100mslive/hls-player)
[![License](https://img.shields.io/npm/l/@100mslive/hls-player)](https://www.100ms.live/)
![Tree shaking](https://badgen.net/bundlephobia/tree-shaking/@100mslive/hls-player)

The `HMSHLSPlayer` is an HLS player offered by 100ms that can be used to play HLS streams. The player takes a URL and video element to play the stream.

## How to integrate HLS Player SDK

You can use Node package manager or yarn to add HMSHLSPlayer sdk to your project.
Use [@100mslive/hls-player](https://www.npmjs.com/package/@100mslive/hls-player) as the package source.

```bash
npm i @100mslive/hls-player
```

## HMSHLSPlayer methods

Below shows all the methods exposed from player

```javascript
interface IHMSHLSPlayer {
  /**
   * @returns get html video element
   */
  getVideoElement(): HTMLVideoElement;

  /**
   * set video volumne
   * @param { volume } - in range [0,100]
   */
  setVolume(volume: number): void;
  /**
   *
   * @returns returns HMSHLSLayer which represents current
   * quality.
   */
  getLayer(): HMSHLSLayer | null;
  /**
   *
   * @param { HMSHLSLayer } layer - layer we want to set the stream to.
   * set { height: auto } to set the layer to auto
   */
  setLayer(layer: HMSHLSLayer): void;
  /**
   * move the video to Live
   */
  seekToLivePosition(): Promise<void>;
  /**
   * play stream
   * call this when autoplay error is received
   */
  play(): Promise<void>;
  /**
   * pause stream
   */
  pause(): void;

  /**
   * It will update the video element current time
   * @param seekValue Pass currentTime in second
   */
  seekTo(seekValue: number): void;
}
```

### How to use Player's HLS Stream

You create an instance of HMSHLSPlayer like below:

```javascript
import { HMSHLSPlayer } from '@100mslive/hls-player';

// hls url should be provided which player will run.
// second parameter is optional, if you had video element then pass to player else we will create one.
const hlsPlayer = new HMSHLSPlayer(hlsURL, videoEl)

// if video element is not present, we will create a new video element which can be attached to your ui.
const videoEl = hlsPlayer.getVideoElement();
```

### How to pause and resume the playback

You call play/pause on the hlsPlayer instance like below:

```javascript
// return Promise<void>
hmsPlayer.play()

hmsPlayer.pause()
```

### How to seek forward or backward

You use `seekTo` methods on the hlsPlayer to seek to any position in video, below is given example:

```javascript
// seekValue Pass currentTime in second
hmsPlayer.seekTo(5)
```

### How to seek to live position

You use `seekToLivePosition` methods on the hlsPlayer instance to go to the live poition like below:

```javascript
hmsPlayer.seekToLivePosition()
```

### How to change volume of HLS playback

Use volume property to change the volume of HLS player. The volume level is between 0-100. Volume is set to 100 by default.

```javascript
hlsPlayer.setVolume(50);
```

### Set video quality level to hls player

```javascript
/**
*
* @returns returns HMSHLSLayer which represents current
* quality.
*/
hlsPlayer.getLayer(): HMSHLSLayer | null;
/**
*
* @param { HMSHLSLayer } layer - layer we want to set the stream to.
* set { height: auto } to set the layer to auto
*/
hlsPlayer.setLayer(layer: HMSHLSLayer): void;

// quality interface
interface HMSHLSLayer {
  readonly bitrate: number;
  readonly height?: number;
  readonly id?: number;
  readonly width?: number;
  url: string;
  resolution?: string;
}
```

## Events exposed from HMSHLSPlayer

We are exposing events from our hls player.

```javascript
enum HMSHLSPlayerEvents {
  TIMED_METADATA_LOADED = 'timed-metadata',
  SEEK_POS_BEHIND_LIVE_EDGE = 'seek-pos-behind-live-edge',

  CURRENT_TIME = 'current-time',
  AUTOPLAY_BLOCKED = 'autoplay-blocked',

  MANIFEST_LOADED = 'manifest-loaded',
  LAYER_UPDATED = 'layer-updated',

  ERROR = 'error',
  PLAYBACK_STATE = 'playback-state',
  STATS = 'stats',
}
```

### Playback state

```javascript
enum HLSPlaybackState {
  playing,
  paused,
}
interface HMSHLSPlaybackState {
  state: HLSPlaybackState;
}
hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, (event: HMSHLSPlayerEvents, data: HMSHLSPlaybackState): void => {});
```

### HLS Stats

```javascript
interface HlsPlayerStats {
    /** Estimated bandwidth in bits/sec. Could be used to show connection speed. */
    bandwidthEstimate?: number;
    /** The bitrate of the current level that is playing. Given in bits/sec */
    bitrate?: number;
    /** the amount of video available in forward buffer. Given in ms */
    bufferedDuration?: number;
    /** how far is the current playback from live edge.*/
    distanceFromLive?: number;
    /** total Frames dropped since started watching the stream. */
    droppedFrames?: number;
    /** the m3u8 url of the current level that is being played */
    url?: string;
    /** the resolution of the level of the video that is being played */
    videoSize?: {
        height: number;
        width: number;
    };
}

hlsPlayer.on(HMSHLSPlayerEvents.STATS, (event: HMSHLSPlayerEvents, data: HlsPlayerStats): void => {});
```

### Manifest loaded data

Hls player will provide a manifest which will provide a data like different quality layer once url is loaded.

```javascript
interface HMSHLSManifestLoaded {
  layers: HMSHLSLayer[];
}
hlsPlayer.on(HMSHLSPlayerEvents.MANIFEST_LOADED, (event: HMSHLSPlayerEvents, data: HMSHLSManifestLoaded): void => {});
```

### Quality changed data

```javascript
interface HMSHLSLayerUpdated {
  layer: HMSHLSLayer;
}
hlsPlayer.on(HMSHLSPlayerEvents.LAYER_UPDATED, (event: HMSHLSPlayerEvents, data: HMSHLSLayerUpdated): void => {});
```

### Live Event

Player will let you know if player is plaaying video live or not

```javascript
interface HMSHLSStreamLive {
  isLive: boolean;
}
hlsPlayer.on(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, (event: HMSHLSPlayerEvents, data: HMSHLSStreamLive): void => {});
```

### HLS timed-metadata

HLS player will parse and send the timed-metadata.

```javascript
interface HMSHLSCue {
  id?: string;
  payload: string;
  duration: number;
  startDate: Date;
  endDate?: Date;
}
hlsPlayer.on(HMSHLSPlayerEvents.TIMED_METADATA_LOADED, (event: HMSHLSPlayerEvents, data: HMSHLSCue): void => {});
```

### Error handling

```javascript
interface HMSHLSException {
  name: string,
   message: string,
  description: string,
  isTerminal: boolean, // decide if player error will automatically restart(if false)
}
hlsPlayer.on(HMSHLSPlayerEvents.ERROR, (event: HMSHLSPlayerEvents, data: HMSHLSException): void => {});
hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, (event: HMSHLSPlayerEvents, data: HMSHLSException): void => {});
```

### Video current time

```javascript
hlsPlayer.on(HMSHLSPlayerEvents.CURRENT_TIME, (event: HMSHLSPlayerEvents, data: number): void => {});
```

### Example for events usage

Below are the simple example of how to use hls player's event

```javascript
const isPlaying = false;
const playbackEventHandler = data => isPlaying = data.state === HLSPlaybackState.paused;
hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
```

## HLS Player example

Below is a simple example in which hls-player will be used in your app.

```javascript
// Vanilla JavaScript Example
import { HLSPlaybackState, HMSHLSPlayer, HMSHLSPlayerEvents } from "@100mslive/hls-player";

const videoEl; // reference for video element
const hlsUrl; // reference to hls url

// variable to handle ui and take some actions
let isLive = true, isPaused = false, isAutoBlockedPaused = false;

const handleError = data => console.error("[HLSView] error in hls", data);
const handleNoLongerLive = ({ isLive }) => isLive = isLive;

const playbackEventHandler = data => isPaused = (data.state === HLSPlaybackState.paused);

const handleAutoplayBlock = data => isAutoBlockedPaused = !!data;

const hlsPlayer = new HMSHLSPlayer(hlsUrl, videoEl);

hlsPlayer.on(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
hlsPlayer.on(HMSHLSPlayerEvents.ERROR, handleError);
hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
```

```jsx
// React Example
import { HLSPlaybackState, HMSHLSPlayer, HMSHLSPlayerEvents } from "@100mslive/hls-player";
import { useEffect, useState } from 'react';

const videoEl; // reference for video element
const hlsUrl; // reference to hls url

// variable to handle ui and take some actions
const [isVideoLive, setIsVideoLive] = useState(true);
const [isHlsAutoplayBlocked, setIsHlsAutoplayBlocked] = useState(false);
const [isPaused, setIsPaused] = useState(false);

useEffect(() => {
    const handleError = data => console.error("[HLSView] error in hls", data);
    const handleNoLongerLive = ({ isLive }) => {
        setIsVideoLive(isLive);
    };

    const playbackEventHandler = data =>
        setIsPaused(data.state === HLSPlaybackState.paused);

    const handleAutoplayBlock = data => setIsHlsAutoplayBlocked(!!data);
    const hlsPlayer = new HMSHLSPlayer(hlsUrl, videoEl);

    hlsPlayer.on(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
    hlsPlayer.on(HMSHLSPlayerEvents.ERROR, handleError);
    hlsPlayer.on(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
    hlsPlayer.on(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
    return () => {
        hlsPlayer.off(HMSHLSPlayerEvents.SEEK_POS_BEHIND_LIVE_EDGE, handleNoLongerLive);
        hlsPlayer.off(HMSHLSPlayerEvents.ERROR, handleError);
        hlsPlayer.off(HMSHLSPlayerEvents.PLAYBACK_STATE, playbackEventHandler);
        hlsPlayer.off(HMSHLSPlayerEvents.AUTOPLAY_BLOCKED, handleAutoplayBlock);
    }
}, []);

```
