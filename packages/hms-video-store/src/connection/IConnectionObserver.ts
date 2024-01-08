export default interface IConnectionObserver {
  onIceConnectionChange(newState: RTCIceConnectionState): void;

  // @TODO(eswar): Remove this. Use iceconnectionstate change with interval and threshold.
  onConnectionStateChange(newState: RTCPeerConnectionState): void;
}
