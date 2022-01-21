import { RTCTrackStats } from '../interfaces/webrtc-stats';
import { isPresent } from '../utils/validations';

/**
 * Ref: https://github.dev/peermetrics/webrtc-stats/blob/b5c1fed68325543e6f563c6d3f4450a4b51e12b7/src/utils.ts#L62
 */
export const computeBitrate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => computeStatRate(statName, newReport, oldReport) * 8; // Bytes to bits

const computeStatRate = <T extends RTCIceCandidatePairStats | RTCTrackStats>(
  statName: keyof T,
  newReport?: T,
  oldReport?: T,
): number => {
  const newVal = newReport && newReport[statName];
  const oldVal = oldReport ? oldReport[statName] : null;
  if (newReport && oldReport && isPresent(newVal) && isPresent(oldVal)) {
    // Type not null checked in `isPresent`
    // * 1000 - ms to s
    return (
      computeNumberRate(
        newVal as unknown as number,
        oldVal as unknown as number,
        newReport.timestamp,
        oldReport.timestamp,
      ) * 1000
    );
  } else {
    return 0;
  }
};

export const computeNumberRate = (newVal?: number, oldVal?: number, newTimestamp?: number, oldTimestamp?: number) => {
  if (isPresent(newVal) && isPresent(oldVal) && newTimestamp && oldTimestamp) {
    return ((newVal as number) - (oldVal as number)) / (newTimestamp - oldTimestamp);
  } else {
    return 0;
  }
};
