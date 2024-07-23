export interface RTCIceCandidatePair {
  local?: RTCIceCandidate;
  remote?: RTCIceCandidate;
}

export enum HMSConnectionEvents {
  ICE_CONNECTION_STATE_CHANGE = 'iceConnectionStateChange',
  CONNECTION_STATE_CHANGE = 'connectionStateChange',
  ICE_CANDIDATE = 'iceCandidate',
  SELECTED_CANDIDATE_PAIR_CHANGE = 'selectedCandidatePairChange',
  DTLS_STATE_CHANGE = 'dtlsStateChange',
  DTLS_ERROR = 'dtlsError',
  RENEGOTIATION_NEEDED = 'renegotiationNeeded',
  ON_TRACK_ADD = 'trackAdd',
  ON_TRACK_REMOVE = 'trackRemove',
  ON_API_CHANNEL_MESSAGE = 'apiChannelMessage',
}
