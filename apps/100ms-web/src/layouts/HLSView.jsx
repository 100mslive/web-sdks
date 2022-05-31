import React, { useEffect, useRef, Fragment } from "react";
import { useHMSStore, selectHLSState } from "@100mslive/react-sdk";
import { Box, Flex, styled, Text } from "@100mslive/react-ui";
import videojs from "video.js";
import { ChatView } from "../components/chatView";
// import { FeatureFlags } from "../services/FeatureFlags";
import { useIsChatOpen } from "../components/AppData/useChatState";

const HLSVideo = styled("video", {
  h: "100%",
  margin: "0 auto",
});

const HLSView = () => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const hlsState = useHMSStore(selectHLSState);
  const isChatOpen = useIsChatOpen();
  const hlsUrl = hlsState.variants[0]?.url;
  // useEffect(() => {
  //   if (videoRef.current && hlsUrl) {
  //     if (Hls.isSupported()) {
  //       let hls = new Hls(getHLSConfig());
  //       hls.loadSource(hlsUrl);
  //       hls.attachMedia(videoRef.current);
  //     } else if (
  //       videoRef.current.canPlayType("application/vnd.apple.mpegurl")
  //     ) {
  //       videoRef.current.src = hlsUrl;
  //     }
  //   }
  // }, [hlsUrl]);

  const videoJsOptions = {
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    sources: [
      {
        src: hlsUrl,
        type: "application/x-mpegURL",
      },
    ],
  };

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current;

      if (!videoElement) return;

      playerRef.current = videojs(videoElement, videoJsOptions, () => {
        // onReady && onReady(player);
        console.log(playerRef.current, "is READY");
      });

      // You can update player in the `else` block here, for example:
    } else {
      //   player.autoplay(options.autoplay);
      //   player.src(options.sources);
    }
  }, [hlsUrl, videoRef]);

  // Dispose the Video.js player when the functional component unmounts
  useEffect(() => {
    const player = playerRef.current;
    return () => {
      if (player) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  return (
    <Fragment>
      {hlsUrl ? (
        <HLSVideo ref={videoRef} autoPlay controls />
      ) : (
        <Flex align="center" justify="center" css={{ size: "100%" }}>
          <Text variant="md" css={{ textAlign: "center" }}>
            Waiting for the Streaming to start...
          </Text>
        </Flex>
      )}
      {isChatOpen && (
        <Box
          css={{
            height: "50%",
            position: "absolute",
            zIndex: 40,
            bottom: "$20",
            right: 0,
            width: "20%",
            "@sm": {
              width: "75%",
            },
          }}
        >
          <ChatView />
        </Box>
      )}
    </Fragment>
  );
};

// function getHLSConfig() {
//   if (FeatureFlags.optimiseHLSLatency()) {
//     // should reduce the latency by around 2-3 more seconds. Won't work well without good internet.
//     return {
//       enableWorker: true,
//       liveSyncDuration: 1,
//       liveMaxLatencyDuration: 5,
//       liveDurationInfinity: true,
//       highBufferWatchdogPeriod: 1,
//     };
//   }
//   return {};
// }

export default HLSView;
