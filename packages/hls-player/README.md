`@100mslive/hls-player` is a wrapper on hls.js with easy to use interfaces and also includes 100ms implementations 
on top of hls.js out of the box.

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