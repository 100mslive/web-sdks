import React, { useRef } from 'react';
import { useHMSStatsStore, HMSTrackID, HMSTrackStats, selectHMSStats } from '@100mslive/react-sdk';
import { formatBytes } from './formatBytes';
import { Stats } from './StyledStats';

export interface VideoTileStatsProps {
  videoTrackID?: HMSTrackID;
  audioTrackID?: HMSTrackID;
}

const StatsRow = ({ label = '', value = '', show = true }) => {
  return (
    <>
      {show ? (
        <Stats.Row>
          <Stats.Label>{label}</Stats.Label>
          {value === '' ? <Stats.Value /> : <Stats.Value>{value}</Stats.Value>}
        </Stats.Row>
      ) : null}
    </>
  );
};

const TrackPacketsLostRow = ({ stats }: { stats?: HMSTrackStats }) => {
  const packetsLostRate = (stats?.packetsLostRate ? stats.packetsLostRate.toFixed(2) : stats?.packetsLostRate) + '/s';

  const trackType = stats && stats?.kind.charAt(0).toUpperCase() + stats?.kind.slice(1);

  return (
    <StatsRow
      show={isNotNullish(stats?.packetsLost) && isNotNullish(stats?.packetsLostRate)}
      label={`Packet Loss (${trackType === 'Video' ? 'V' : 'A'})`}
      value={`${stats?.packetsLost}(${packetsLostRate})`}
    />
  );
};

export function VideoTileStats({ videoTrackID, audioTrackID }: VideoTileStatsProps) {
  const audioTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(audioTrackID));

  const videoTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(videoTrackID));
  const rootRef = useRef<HTMLDivElement>(null);
  const containerStyle: React.CSSProperties = {};
  const parentHeight = rootRef.current?.parentElement?.clientHeight || 0;
  const parentWidth = rootRef.current?.parentElement?.clientWidth || 0;
  const compact = parentHeight < 300;
  if (compact) {
    containerStyle.width = `calc(${parentWidth}px - 1rem)`;
    containerStyle.maxHeight = parentHeight * 0.75;
    containerStyle.overflowY = 'auto';
  }
  // Viewer role - no stats to show
  if (!(audioTrackStats || videoTrackStats)) {
    return null;
  }
  return (
    <Stats.Root style={containerStyle} ref={rootRef} compact={compact}>
      <table>
        <tbody>
          {videoTrackStats?.frameWidth ? (
            <StatsRow label="Width" value={videoTrackStats?.frameWidth.toString()} />
          ) : null}
          {videoTrackStats?.frameHeight ? (
            <StatsRow label="Height" value={videoTrackStats?.frameHeight.toString()} />
          ) : null}

          <StatsRow
            show={isNotNullish(videoTrackStats?.framesPerSecond)}
            label="FPS"
            value={`${videoTrackStats?.framesPerSecond} ${
              isNotNullish(videoTrackStats?.framesDropped) ? `(${videoTrackStats?.framesDropped} dropped)` : ''
            }`}
          />

          <StatsRow
            show={isNotNullish(videoTrackStats?.bitrate)}
            label="Bitrate (V)"
            value={formatBytes(videoTrackStats?.bitrate, 'b/s')}
          />

          <StatsRow
            show={isNotNullish(audioTrackStats?.bitrate)}
            label="Bitrate (A)"
            value={formatBytes(audioTrackStats?.bitrate, 'b/s')}
          />

          <TrackPacketsLostRow stats={videoTrackStats} />
          <TrackPacketsLostRow stats={audioTrackStats} />

          <StatsRow
            show={isNotNullish(videoTrackStats?.jitter)}
            label="Jitter (V)"
            value={videoTrackStats?.jitter?.toString()}
          />

          <StatsRow
            show={isNotNullish(audioTrackStats?.jitter)}
            label="Jitter (A)"
            value={audioTrackStats?.jitter?.toString()}
          />
        </tbody>
      </table>
    </Stats.Root>
  );
}

/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isNotNullish(value: any) {
  return value !== undefined && value !== null;
}
