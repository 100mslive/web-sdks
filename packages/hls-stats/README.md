# @100mslive/hms-stats

A simple library for HLS stats for Hls.js.

## Installation

```shell
yarn add @100mslive/hls-stats
```
or

```shell
npm install --save @100mslive/hls-stats
```

## Usage

### initialization
```javascript

import Hls from "hls.js";

/**
 * Initialize Hls.js and attach the video element.
 */
const hlsInstance = new Hls();
hlsInstance.loadSource(hlsUrl);
hlsInstance.attachMedia(videoEl);

/**
 * initialize HlsStats
 */
const hlsStats = new HlsStats(hlsController.getHlsJsInstance(), videoEl);

```
### Subscribing to Stats
`hlsStats` have a `subscribe` function which takes two parameter. a `callbackFn` and an `interval` in ms.
The `interval` tells how frequent you want hls-stats to report back to you. Default is 2000ms

```javascript
const unsubscribe = hlsStats.subscribe(state => {
    // ...
});

```
the `subscribe()` also returns a reference to `unsubscribe()` function which could later be used to unsubscribe
from your subscription

## Exposed Stats
hls-stats currently exposes the following stats

| Name                             | Description                                             | Unit            | Usage                                                                                         |
|----------------------------------|---------------------------------------------------------|-----------------|-----------------------------------------------------------------------------------------------|
| bandwidthEstimate                | The current bandwidth, as seen by the player            | bits per second | Use this to show the current network speed of the user                                        |
| bitrate                          | server indicated bitrate of current layer of hls stream | bits per second | Use to know the bitrate required for current layer                                            |
| bufferedDuration                 | buffered duration from the current position             | ms              | This can be used to show how much data is buffered from the current location (forward buffer) |
| distanceFromLiveEdge             | The distance from the live edge                         | ms              | Used to know currently buffered duration ahead                                                |
| droppedFrames                    | The number of dropped frames till now                   |                 | Used to calculate the total num of dropped frames                                             | 
| videoSize.width videoSize.height | The width and height of the video                       | px              | Used to know the resolution being played                                                      |
| watchDuration                    | Total duration watched                                  | ms              | used to know the overall watch duration (not the stream length)                               |