export interface RTCIceCandidatePair {
  local?: RTCIceCandidate;
  remote?: RTCIceCandidate;
}

export default interface IConnectionObserver {
  onIceConnectionChange(newState: RTCIceConnectionState): void;

  // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
  onConnectionStateChange(newState: RTCPeerConnectionState): void;

  onIceCandidate(candidate: RTCIceCandidate): void;

  onSelectedCandidatePairChange(candidatePair: RTCIceCandidatePair): void;
}
