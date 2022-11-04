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
        padding: "$2 $4 $2 $4",
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
      <HlsStatsRow label="URL">
        <a
          style={{ cursor: "pointer", textDecoration: "underline" }}
          href={hlsStatsState?.url}
          target="_blank"
          rel="noreferrer"
        >
          {hlsStatsState?.url}
        </a>
      </HlsStatsRow>
      <HlsStatsRow label="Video Size">
        {` ${hlsStatsState?.videoSize?.width}x${hlsStatsState?.videoSize?.height}`}
      </HlsStatsRow>
      <HlsStatsRow label="Buffer Health">
        {hlsStatsState?.bufferHealth?.toFixed(2)}{" "}
      </HlsStatsRow>
      <HlsStatsRow label="Connection Speed">
        {`${(hlsStatsState?.bandwidthEstimate / (1000 * 1000)).toFixed(2)}Mbps`}
      </HlsStatsRow>
      <HlsStatsRow label="Bitrate">
        {`${(hlsStatsState?.bitrate / (1000 * 1000)).toFixed(2)}Mbps`}
      </HlsStatsRow>
    </Flex>
  );
}

const HlsStatsRow = ({ label, children }) => {
  return (
    <Flex id="hls-stats-row" gap={1}>
      <Text
        css={{
          width: "30%",
          "@md": { fontSize: "$md" },
          "@sm": { fontSize: "$sm" },
        }}
      >
        {label}
      </Text>
      <Text
        css={{
          "@md": { fontSize: "$md" },
          "@sm": { fontSize: "$sm" },
          width: "70%",
          overflowWrap: "break-word",
        }}
      >
        {children}
      </Text>
    </Flex>
  );
};
