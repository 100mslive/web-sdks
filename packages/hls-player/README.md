`@100mslive/hls-player` is currently a wrapper on hls.js with easy to use interface and few add-ons for [100ms's interactive live streaming feature](https://www.100ms.live/docs/javascript/v2/how--to-guides/record-and-live-stream/hls/hls).

Sample usage: 

```
import {
  HLSPlaybackState,
} from "@100mslive/hls-player";

// hlsUrl is the url in which the hls stream is ongoing
// videoElement is the video element where you want to play the stream
const player = new HMSHLSPlayer(hlsUrl, videoElement);
player.play()

```

More details to be added soon.
