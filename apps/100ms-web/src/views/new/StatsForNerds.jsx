import { InfoIcon } from "@100mslive/react-icons";
import {
  selectHMSStats,
  selectPeersMap,
  selectTracksMap,
  useHMSStatsStore,
  useHMSStore,
} from "@100mslive/react-sdk";
import {
  Box,
  Dialog,
  Flex,
  HorizontalDivider,
  Switch,
} from "@100mslive/react-ui";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "../../store/AppContext";
import { DialogContent, DialogRow, DialogSelect } from "./DialogContent";

const formatBytes = (bytes, unit = "B", decimals = 2) => {
  if (bytes === 0) return "0 " + unit;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"].map(
    size => size + unit
  );

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const useTracksWithLabel = () => {
  const tracksMap = useHMSStore(selectTracksMap);
  const peersMap = useHMSStore(selectPeersMap);
  const tracksWithLabels = useMemo(
    () =>
      Object.values(tracksMap).map(track => {
        const peerName = peersMap[track.peerId]?.name;
        return {
          id: track.id,
          label: `${peerName} ${track.source} ${track.type}`,
        };
      }),
    [tracksMap, peersMap]
  );
  return tracksWithLabels;
};

const StatsRow = ({ label, value }) => (
  <DialogRow justify="start" css={{ my: "0.5rem" }}>
    <Box css={{ w: "50%" }}>{label}</Box>
    <Box>{value}</Box>
  </DialogRow>
);

const LocalPeerStats = () => {
  const stats = useHMSStatsStore(selectHMSStats.localPeerStats);

  if (!stats) {
    return null;
  }

  return (
    <>
      <StatsRow label="Packets Lost" value={stats.subscribe?.packetsLost} />
      <StatsRow label="Jitter" value={stats.subscribe?.jitter} />
      <StatsRow
        label="Publish Bitrate"
        value={formatBytes(stats.publish?.bitrate, "b/s")}
      />
      <StatsRow
        label="Subscribe Bitrate"
        value={formatBytes(stats.subscribe?.bitrate, "b/s")}
      />
      <StatsRow
        label="Total Bytes Sent"
        value={formatBytes(stats.publish?.bytesSent)}
      />
      <StatsRow
        label="Total Bytes Received"
        value={formatBytes(stats.subscribe?.bytesReceived)}
      />
    </>
  );
};

const TrackStats = ({ trackID }) => {
  const stats = useHMSStatsStore(selectHMSStats.trackStatsByID(trackID));
  if (!stats) {
    return null;
  }
  const inbound = stats.type.includes("inbound");

  return (
    <>
      <StatsRow label="Type" value={stats.type + " " + stats.kind} />
      <StatsRow label="Bitrate" value={formatBytes(stats.bitrate, "b/s")} />
      <StatsRow label="Packets Lost" value={stats.packetsLost || "-"} />
      <StatsRow label="Jitter" value={stats.jitter || "-"} />
      <StatsRow
        label={inbound ? "Bytes Received" : "Bytes Sent"}
        value={formatBytes(inbound ? stats.bytesReceived : stats.bytesSent)}
      />
      {stats.kind === "video" && (
        <>
          <StatsRow label="Framerate" value={stats.framesPerSecond} />
          {!inbound && (
            <StatsRow
              label="Quality Limitation Reason"
              value={stats.qualityLimitationReason || "-"}
            />
          )}
        </>
      )}
    </>
  );
};

const StatsForNerds = ({ open, onOpenChange }) => {
  const tracksWithLabels = useTracksWithLabel();
  const statsOptions = useMemo(
    () => [
      { id: "local-peer", label: "Local Peer Stats" },
      ...tracksWithLabels,
    ],
    [tracksWithLabels]
  );
  const [selectedStat, setSelectedStat] = useState("local-peer");
  const { showStatsOnTiles, setShowStatsOnTiles } = useContext(AppContext);

  useEffect(() => {
    if (
      selectedStat !== "local-peer" &&
      !tracksWithLabels.find(track => track.id === selectedStat)
    ) {
      setSelectedStat("local-peer");
    }
  }, [tracksWithLabels, selectedStat]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogContent Icon={InfoIcon} title="Stats For Nerds">
        <DialogSelect
          title="Stats For"
          options={statsOptions}
          keyField="id"
          labelField="label"
          selected={selectedStat}
          onChange={setSelectedStat}
        />
        {selectedStat === "local-peer" ? (
          <LocalPeerStats />
        ) : (
          <TrackStats trackID={selectedStat} />
        )}
        <HorizontalDivider css={{ my: "0.8rem" }} />
        <Flex justify="evenly" align="center">
          <h3>Show Stats on Tiles</h3>
          <Switch
            checked={showStatsOnTiles}
            onCheckedChange={setShowStatsOnTiles}
          />
        </Flex>
      </DialogContent>
    </Dialog.Root>
  );
};

export default StatsForNerds;
