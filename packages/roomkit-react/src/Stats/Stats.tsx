import { Fragment, memo } from 'react';
import {
  HMSPeerID,
  HMSTrackID,
  HMSTrackStats,
  RID,
  selectConnectionQualityByPeerID,
  selectHMSStats,
  simulcastMapping,
  useHMSStatsStore,
  useHMSStore,
} from '@100mslive/react-sdk';
import { Tooltip } from '../Tooltip';
import { formatBytes } from './formatBytes';
import { Stats } from './StyledStats';
import { useQoE } from './useQoE';

export interface VideoTileStatsProps {
  videoTrackID?: HMSTrackID;
  audioTrackID?: HMSTrackID;
  peerID?: HMSPeerID;
  isLocal: boolean;
}

/**
 * This component can be used to overlay webrtc stats over the Video Tile. For the local tracks it also includes
 * remote inbound stats as sent by the SFU in receiver report.
 */
export function VideoTileStats({ videoTrackID, audioTrackID, peerID, isLocal = false }: VideoTileStatsProps) {
  const audioSelector = isLocal ? selectHMSStats.localAudioTrackStatsByID : selectHMSStats.trackStatsByID;
  const audioTrackStats = useHMSStatsStore(audioSelector(audioTrackID));
  const localVideoTrackStats = useHMSStatsStore(selectHMSStats.localVideoTrackStatsByID(videoTrackID));
  const remoteVideoTrackStats = useHMSStatsStore(selectHMSStats.trackStatsByID(videoTrackID));
  const videoTrackStats = isLocal ? localVideoTrackStats?.[0] : remoteVideoTrackStats;
  const downlinkScore = useHMSStore(selectConnectionQualityByPeerID(peerID))?.downlinkQuality;
  const availableOutgoingBitrate = useHMSStatsStore(selectHMSStats.availablePublishBitrate);
  const qoe = useQoE({ videoTrackID, audioTrackID, isLocal });

  // Viewer role - no stats to show
  if (!(audioTrackStats || videoTrackStats)) {
    return null;
  }
  return (
    <Stats.Root>
      <table>
        <tbody>
          {isLocal ? (
            <Fragment>
              <StatsRow
                show={isNotNullishAndNot0(availableOutgoingBitrate)}
                label="AOBR"
                tooltip="Available Outgoing Bitrate"
                value={formatBytes(availableOutgoingBitrate, 'b/s')}
              />
              {localVideoTrackStats?.map(stat => {
                if (!stat) {
                  return null;
                }
                const layer = stat.rid ? simulcastMapping[stat.rid as RID] : '';
                return (
                  <Fragment key={`${stat.id}${stat.rid}`}>
                    {layer && <StatsRow label={layer.toUpperCase()} value="" />}
                    <StatsRow
                      show={isNotNullishAndNot0(stat.frameWidth)}
                      label="Width"
                      value={stat.frameWidth?.toString()}
                    />
                    <StatsRow
                      show={isNotNullishAndNot0(stat.frameHeight)}
                      label="Height"
                      value={stat.frameHeight?.toString()}
                    />
                    <StatsRow
                      show={isNotNullishAndNot0(stat.framesPerSecond)}
                      label="FPS"
                      value={`${stat.framesPerSecond} ${
                        isNotNullishAndNot0(stat.framesDropped) ? `(${stat.framesDropped} dropped)` : ''
                      }`}
                    />
                    <StatsRow
                      show={isNotNullish(stat.bitrate)}
                      label="Bitrate(V)"
                      value={formatBytes(stat.bitrate, 'b/s')}
                    />
                    <Stats.Gap />
                  </Fragment>
                );
              })}
            </Fragment>
          ) : (
            <Fragment>
              <StatsRow show={isNotNullish(qoe)} label="QoE" value={qoe} />
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
                  isNotNullishAndNot0(videoTrackStats?.framesDropped)
                    ? `(${videoTrackStats?.framesDropped} dropped)`
                    : ''
                }`}
              />
              <StatsRow
                show={isNotNullish(videoTrackStats?.totalPausesDuration)}
                label="Pauses Duration"
                value={videoTrackStats?.totalPausesDuration}
              />
              <StatsRow
                show={isNotNullish(videoTrackStats?.totalFreezesDuration)}
                label="Freezes Duration"
                value={videoTrackStats?.totalFreezesDuration}
              />
              <StatsRow
                show={isNotNullish(videoTrackStats?.bitrate)}
                label="Bitrate(V)"
                value={formatBytes(videoTrackStats?.bitrate, 'b/s')}
              />
            </Fragment>
          )}

          <StatsRow
            show={isNotNullish(audioTrackStats?.bitrate)}
            label="Bitrate(A)"
            value={formatBytes(audioTrackStats?.bitrate, 'b/s')}
          />

          <StatsRow show={isNotNullish(downlinkScore)} label="CQS" value={downlinkScore} />

          <StatsRow show={isNotNullish(videoTrackStats?.codec)} label="Codec(V)" value={videoTrackStats?.codec} />

          <StatsRow show={isNotNullish(audioTrackStats?.codec)} label="Codec(A)" value={audioTrackStats?.codec} />

          <PacketLostAndJitter audioTrackStats={audioTrackStats} videoTrackStats={videoTrackStats} />
        </tbody>
      </table>
    </Stats.Root>
  );
}

const PacketLostAndJitter = ({
  audioTrackStats,
  videoTrackStats,
}: {
  audioTrackStats?: HMSTrackStats;
  videoTrackStats?: HMSTrackStats;
}) => {
  // for local peer, we'll use the remote inbound stats to get packet loss and jitter, to know whether the track is
  // local we check if the stats type has outbound in it as it's being published from local. Both audio and video
  // tracks are checked in case the user has permission to publish only one of them.
  const isLocalPeer = audioTrackStats?.type.includes('outbound') || videoTrackStats?.type.includes('outbound');
  const audioStats = isLocalPeer ? audioTrackStats?.remote : audioTrackStats;
  const videoStats = isLocalPeer ? videoTrackStats?.remote : videoTrackStats;

  return (
    <>
      <TrackPacketsLostRow label="Packet Loss(V)" stats={videoStats} />
      <TrackPacketsLostRow label="Packet Loss(A)" stats={audioStats} />
      <StatsRow
        show={isNotNullish(videoStats?.jitter)}
        label="Jitter(V)"
        value={`${((videoStats?.jitter ?? 0) * 1000).toFixed(2)} ms`}
      />
      <StatsRow
        show={isNotNullish(audioStats?.jitter)}
        label="Jitter(A)"
        value={`${((audioStats?.jitter ?? 0) * 1000).toFixed(2)} ms`}
      />
    </>
  );
};

const TrackPacketsLostRow = ({
  stats,
  label,
}: {
  stats?: Pick<HMSTrackStats, 'packetsLost' | 'packetsLostRate'>;
  label: string;
}) => {
  const packetsLostRate = `${stats?.packetsLostRate ? stats.packetsLostRate.toFixed(2) : 0}/s`;

  return (
    <StatsRow
      show={isNotNullishAndNot0(stats?.packetsLost)}
      label={label}
      value={`${stats?.packetsLost}(${packetsLostRate})`}
    />
  );
};

const RawStatsRow = ({
  label = '',
  value = '',
  tooltip = '',
  show = true,
}: {
  label: string;
  value?: string | number;
  show?: boolean;
  tooltip?: string;
}) => {
  const statsLabel = <Stats.Label>{label}</Stats.Label>;

  return (
    <>
      {show ? (
        <Stats.Row>
          {tooltip ? (
            <Tooltip side="top" title={tooltip}>
              {statsLabel}
            </Tooltip>
          ) : (
            statsLabel
          )}
          {value === '' ? <Stats.Value /> : <Stats.Value>{value}</Stats.Value>}
        </Stats.Row>
      ) : null}
    </>
  );
};

// memoize so only the rows which change rerender
const StatsRow = memo(RawStatsRow);

export function isNotNullishAndNot0(value: number | undefined | null) {
  return isNotNullish(value) && value !== 0;
}

/**
 * Check only for presence(not truthy) of a value.
 * Use in places where 0, false need to be considered valid.
 */
export function isNotNullish(value: number | string | undefined | null) {
  return value !== undefined && value !== null;
}
