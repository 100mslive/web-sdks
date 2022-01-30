import React from 'react';
import { useHMSStatsStore, HMSTrackID, HMSTrackStats, selectHMSStats } from '@100mslive/react-sdk';
import { formatBytes } from './formatBytes';
import { Stats } from './StyledStats';

export interface VideoTileStatsProps {
  videoTrackID?: HMSTrackID;
  audioTrackID?: HMSTrackID;
}

const RawStatsRow = ({ label = '', value = '', show = true }) => {
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

// memoize so only the rows which change rerender
const StatsRow = React.memo(RawStatsRow);

const TrackPacketsLostRow = ({
  stats,
  label,
}: {
  stats?: Pick<HMSTrackStats, 'packetsLost' | 'packetsLostRate'>;
  label: string;
}) => {
  const packetsLostRate = (stats?.packetsLostRate ? stats.packetsLostRate.toFixed(2) : 0) + '/s';

  return (
    <StatsRow
      show={isNotNullishAndNot0(stats?.packetsLost)}
      label={label}
      value={`${stats?.packetsLost}(${packetsLostRate})`}
    />
  );
};

const RemoteStats = ({
  audioTrackStats,
  videoTrackStats,
  remote = false,
}: {
  audioTrackStats?: HMSTrackStats;
  videoTrackStats?: HMSTrackStats;
  remote?: boolean;
}) => {
  const audioStats = remote ? audioTrackStats?.remote : audioTrackStats;
  const videoStats = remote ? videoTrackStats?.remote : videoTrackStats;
  return (
    <>
      <TrackPacketsLostRow label="Packet Loss(V)" stats={videoStats} />
      <TrackPacketsLostRow label="Packet Loss(A)" stats={audioStats} />
      <StatsRow show={isNotNullish(videoStats?.jitter)} label="Jitter(V)" value={videoStats?.jitter?.toFixed(4)} />
      <StatsRow show={isNotNullish(audioStats?.jitter)} label="Jitter(A)" value={audioStats?.jitter?.toFixed(4)} />
    </>
  );
};

export function VideoTileStats({ videoTrackID, audioTrackID }: VideoTileStatsProps) {
  const audioTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(audioTrackID));
  const videoTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(videoTrackID));
  // Viewer role - no stats to show
  if (!(audioTrackStats || videoTrackStats)) {
    return null;
  }
  return (
    <Stats.Root>
      <table>
        <tbody>
          <StatsRow
            show={isNotNullishAndNot0(videoTrackStats?.frameWidth)}
            label="Width"
            value={videoTrackStats?.frameWidth?.toString()}
          />
          <StatsRow
            show={isNotNullishAndNot0(videoTrackStats?.frameHeight)}
            label="Height"
            value={videoTrackStats?.frameHeight?.toString()}
          />
          <StatsRow
            show={isNotNullishAndNot0(videoTrackStats?.framesPerSecond)}
            label="FPS"
            value={`${videoTrackStats?.framesPerSecond} ${
              isNotNullishAndNot0(videoTrackStats?.framesDropped) ? `(${videoTrackStats?.framesDropped} dropped)` : ''
            }`}
          />

          <StatsRow
            show={isNotNullish(videoTrackStats?.bitrate)}
            label="Bitrate(V)"
            value={formatBytes(videoTrackStats?.bitrate, 'b/s')}
          />

          <StatsRow
            show={isNotNullish(audioTrackStats?.bitrate)}
            label="Bitrate(A)"
            value={formatBytes(audioTrackStats?.bitrate, 'b/s')}
          />
          <RemoteStats
            audioTrackStats={audioTrackStats}
            videoTrackStats={videoTrackStats}
            remote={audioTrackStats?.type.includes('outbound')}
          />
        </tbody>
      </table>
    </Stats.Root>
  );
}

export function isNotNullishAndNot0(value: number | undefined | null) {
  return isNotNullish(value) && value !== 0;
}

/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isNotNullish(value: number | undefined | null) {
  return value !== undefined && value !== null;
}
