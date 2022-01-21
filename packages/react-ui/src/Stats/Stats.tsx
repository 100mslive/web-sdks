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
  const packetsLostRate = (stats?.packetsLostRate ? stats.packetsLostRate.toFixed(2) : stats?.packetsLostRate) + '/s';

  const trackType = stats && stats?.kind.charAt(0).toUpperCase() + stats?.kind.slice(1);

  return isNullish(stats?.packetsLost) && isNullish(stats?.packetsLostRate) ? (
    <StatsRow
      label={`Packet Loss (${trackType === 'Video' ? 'V' : 'A'})`}
      value={`${stats?.packetsLost}(${packetsLostRate})`}
    />
  ) : null;
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
            <StatsRow
              label={videoTrackStats?.type.includes('inbound') ? 'Bitrate (V)' : 'Bitrate (V)'}
              value={formatBytes(videoTrackStats?.bitrate, 'b/s')}
            />
          ) : null}
          {isNullish(audioTrackStats?.bitrate) ? (
            <StatsRow
              label={audioTrackStats?.type.includes('inbound') ? 'Bitrate (A)' : 'Bitrate (A)'}
              value={formatBytes(audioTrackStats?.bitrate, 'b/s')}
            />
          ) : null}

          <TrackPacketsLostRow stats={videoTrackStats} />
          <TrackPacketsLostRow stats={audioTrackStats} />

          {isNullish(videoTrackStats?.jitter) ? (
            <StatsRow label="Jitter (V)" value={videoTrackStats?.jitter?.toString()} />
          ) : null}
          {isNullish(audioTrackStats?.jitter) ? (
            <StatsRow label="Jitter (A)" value={audioTrackStats?.jitter?.toString()} />
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
