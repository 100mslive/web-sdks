import { HMSTrack } from '../../media/tracks/HMSTrack';
import IConnectionObserver from '../IConnectionObserver';

export default interface ISubscribeConnectionObserver extends IConnectionObserver {
  /** Triggered when a remote peer opens a DataChannel.
   * Internally there is a data channel with label [API_DATA_CHANNEL]
   * which is internally.
   *
   * TODO: Notify about all the other data channels to the sdk-layer */
  // onDataChannel(channel: RTCDataChannel): void

  onApiChannelMessage(message: string): void;

  /** Triggered when media is received on a new streams from remote peer. */
  onTrackAdd(track: HMSTrack): void;

  /** Triggered when a remote peer close a streams.*/
  onTrackRemove(track: HMSTrack): void;

  /**
   * NOTE: No [PeerConnection.Observer.onRenegotiationNeeded] override
   * is required here as we never add/remove any local track/streams
   *
   * All the remote streams negotiation is handled via the signalling server.
   */
}
