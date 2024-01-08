import IConnectionObserver from '../IConnectionObserver';

export interface IPublishConnectionObserver extends IConnectionObserver {
  /** Triggered when renegotiation is necessary.
   * - A new local track/stream is added/removed
   * - A new data-channel is added/removed
   */
  onRenegotiationNeeded(): Promise<void>;

  onDTLSTransportStateChange: (state?: RTCDtlsTransportState) => void;

  onDTLSTransportError: (error: Error) => void;
}
