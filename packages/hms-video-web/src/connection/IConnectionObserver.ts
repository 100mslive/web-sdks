export default interface IConnectionObserver {
  onIceConnectionChange(newState: RTCIceConnectionState): void;
}
