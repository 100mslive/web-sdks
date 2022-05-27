import { selectHLSState, useHMSStore } from "@100mslive/react-sdk";
import React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { useIsChatOpen } from "../components/AppData/useChatState";

export const VJSHLSView = props => {
  const hlsState = useHMSStore(selectHLSState);
  const isChatOpen = useIsChatOpen();
  const hlsUrl = hlsState.variants[0]?.url;

  const videoRef = React.useRef(null);
  const playerRef = React.useRef(null);

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current;

      if (!videoElement) return;

      const options = { src: hlsUrl, autoplay: true };
      const player = (playerRef.current = videojs(videoElement, options, () => {
        player.log("player is ready");
        // onReady && onReady(player);
      }));

      // You can update player in the `else` block here, for example:
    } else {
      playerRef.autoplay(true);
      playerRef.src(hlsUrl);
    }
  }, [videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <>
      <h1>VIDEO.JS</h1>
      <div data-vjs-player>
        <video ref={videoRef} className="video-js vjs-big-play-centered" />
      </div>
    </>
  );
};
