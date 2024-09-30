import { HMSAudioTrack, HMSVideoTrack } from '@100mslive/react-sdk';

const PEER_NAME_PLACEHOLDER = 'peerName';

// Map [isLocal, videoSource] to the label to be displayed.
const labelMap = new Map([
  [[true, 'screen'].toString(), 'Your Screen'],
  [[true, 'regular'].toString(), `You (${PEER_NAME_PLACEHOLDER})`],
  [[false, 'screen'].toString(), `${PEER_NAME_PLACEHOLDER}'s Screen`],
  [[false, 'regular'].toString(), PEER_NAME_PLACEHOLDER],
  [[true, undefined].toString(), `You (${PEER_NAME_PLACEHOLDER})`],
  [[false, undefined].toString(), `${PEER_NAME_PLACEHOLDER}`],
]);

export const getVideoTileLabel = ({
  peerName,
  isLocal,
  videoTrack,
  audioTrack,
}: {
  isLocal: boolean;
  peerName?: string;
  videoTrack?: HMSVideoTrack | null;
  audioTrack?: HMSAudioTrack | null;
}) => {
  const isPeerPresent = peerName !== undefined;
  if (!isPeerPresent || !videoTrack) {
    // for peers with only audio track
    const label = labelMap.get([isLocal, undefined].toString());
    return isPeerPresent && label ? label.replace(PEER_NAME_PLACEHOLDER, peerName) : '';
  }
  const isLocallyMuted = audioTrack?.volume === 0;
  // Map [isLocal, videoSource] to the label to be displayed.
  let label = labelMap.get([isLocal, videoTrack.source].toString());
  if (label) {
    label = label.replace(PEER_NAME_PLACEHOLDER, peerName);
  } else {
    label = `${peerName} ${videoTrack.source}`;
  }
  // label = `${label}${track.degraded ? '(Degraded)' : ''}`;
  return `${label}${isLocallyMuted ? ' (Muted for you)' : ''}`;
};
