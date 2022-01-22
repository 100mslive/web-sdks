import React from 'react';
import { useHMSStatsStore, HMSTrackID, HMSTrackStats, selectHMSStats } from '@100mslive/react-sdk';
import { formatBytes } from './formatBytes';
import { Stats } from './StyledStats';

export interface VideoTileStatsProps {
  videoTrackID?: HMSTrackID;
  audioTrackID?: HMSTrackID;
  height: number;
}

const StatsRow = ({ label = '', value = '' }) => {
  return (
    <Stats.Row>
      <Stats.Label>{label}</Stats.Label>
      {value === '' ? <Stats.Value /> : <Stats.Value>{value}</Stats.Value>}
    </Stats.Row>
  );
};

const TrackPacketsLostRow = ({ stats }: { stats?: HMSTrackStats }) => {
  if (!(isNullish(stats?.packetsLost) && isNullish(stats?.packetsLostRate))) {
    return null;
  }

  const packetsLostRate = (stats?.packetsLostRate ? stats.packetsLostRate.toFixed(2) : stats?.packetsLostRate) + '/s';
  const trackType = stats && stats?.kind.charAt(0).toUpperCase() + stats?.kind.slice(1);

  return (
    <StatsRow
      label={`Packet Loss (${trackType === 'Video' ? 'V' : 'A'})`}
      value={`${stats?.packetsLost}(${packetsLostRate})`}
    />
  );
};

export function VideoTileStats({ videoTrackID, audioTrackID, height }: VideoTileStatsProps) {
  const audioTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(audioTrackID));

  const videoTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(videoTrackID));

  // Viewer role - no stats to show
  if (!(audioTrackStats || videoTrackStats)) {
    return null;
  }
  return (
    <Stats.Root contract={height < 300}>
      <table>
        <tbody>
          {videoTrackStats?.frameWidth ? (
            <StatsRow label="Width" value={videoTrackStats?.frameWidth.toString()} />
          ) : null}
          {videoTrackStats?.frameHeight ? (
            <StatsRow label="Height" value={videoTrackStats?.frameHeight.toString()} />
          ) : null}
          {videoTrackStats?.framesPerSecond ? (
            <StatsRow
              label="FPS"
              value={`${videoTrackStats?.framesPerSecond} ${
                isNullish(videoTrackStats?.framesDropped) ? `(${videoTrackStats?.framesDropped} dropped)` : ''
              }`}
            />
          ) : null}
          {isNullish(videoTrackStats?.bitrate) ? (
            <StatsRow label={'Bitrate (V)'} value={formatBytes(videoTrackStats?.bitrate, 'b/s')} />
          ) : null}
          {isNullish(audioTrackStats?.bitrate) ? (
            <StatsRow label={'Bitrate (A)'} value={formatBytes(audioTrackStats?.bitrate, 'b/s')} />
          ) : null}

          <TrackPacketsLostRow stats={videoTrackStats} />
          <TrackPacketsLostRow stats={audioTrackStats} />

          {isNullish(videoTrackStats?.jitter) ? (
            <StatsRow label="Jitter (V)" value={videoTrackStats?.jitter?.toFixed(4).toString()} />
          ) : null}
          {isNullish(audioTrackStats?.jitter) ? (
            <StatsRow label="Jitter (A)" value={audioTrackStats?.jitter?.toFixed(4).toString()} />
          ) : null}
        </tbody>
      </table>
    </Stats.Root>
  );
}

/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isNullish(value: any) {
  return value !== undefined && value !== null;
}
