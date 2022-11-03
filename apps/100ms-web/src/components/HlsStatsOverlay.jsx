import React from "react";
import { CloseIcon } from "@100mslive/react-icons";
import { Flex, IconButton, Text } from "@100mslive/react-ui";

export function HlsStatsOverlay({ hlsStatsState, onClose }) {
  return (
    <Flex
      id="hls-stats-overlay"
      css={{
        position: "absolute",
        maxWidth: "60%",
        "@md": { maxWidth: "60%" },
        "@sm": { maxWidth: "100%" },
        padding: "$8",
        zIndex: 100,
        backgroundColor: "rgba(101,112,128, 0.25)",
      }}
      direction="column"
    >
      <Flex id="hls-stats-row" justify="end">
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Flex>
      <Flex id="hls-stats-row" gap={1}>
        <Text
          id="hls-stats-label"
          css={{
            width: "30%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          URL
        </Text>
        <Text
          id="hls-stats-value"
          css={{
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
            width: "70%",
            cursor: "pointer",
            textDecoration: "underline",
            overflowWrap: "break-word",
          }}
        >
          <a
            href={`${hlsStatsState?.url}`}
            target="_blank"
            rel="noreferrer"
          >{`${hlsStatsState?.url}`}</a>
        </Text>
      </Flex>
      <Flex id="hls-stats-row" gap={2}>
        <Text
          id="hls-stats-label"
          css={{
            width: "30%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          Video Size
        </Text>
        <Text
          id="hls-stats-value"
          css={{
            width: "70%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >{` ${hlsStatsState?.videoSize?.width}x${hlsStatsState?.videoSize?.height}`}</Text>
      </Flex>
      <Flex id="hls-stats-row" gap={2}>
        <Text
          id="hls-stats-label"
          css={{
            width: "30%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          Buffer Health
        </Text>
        <Text
          id="hls-stats-value"
          css={{
            width: "70%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          {hlsStatsState?.bufferHealth?.toFixed(2)}
        </Text>
      </Flex>
      <Flex id="hls-stats-row" gap={2}>
        <Text
          id="hls-stats-label"
          css={{
            width: "30%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          Connection Speed
        </Text>
        <Text
          id="hls-stats-value"
          css={{
            width: "70%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >{`${(hlsStatsState?.bandwidthEstimate / (1000 * 1000)).toFixed(
          2
        )}Mbps`}</Text>
      </Flex>
      <Flex id="hls-stats-row" gap={2}>
        <Text
          id="hls-stats-label"
          css={{
            width: "30%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >
          Bitrate
        </Text>
        <Text
          id="hls-stats-value"
          css={{
            width: "70%",
            "@md": { fontSize: "$md" },
            "@sm": { fontSize: "$sm" },
          }}
        >{`${(hlsStatsState?.bitrate / (1000 * 1000)).toFixed(2)}Mbps`}</Text>
      </Flex>
    </Flex>
  );
}
