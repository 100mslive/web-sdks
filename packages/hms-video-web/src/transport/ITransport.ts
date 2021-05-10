import HMSTrack from '../media/tracks/HMSTrack';
import HMSTrackSettings from '../media/settings/HMSTrackSettings';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';

export default interface ITransport {
  join(authToken: string, peerId: string, customData: Object, initEndpoint?: string): Promise<void>;

  leave(): Promise<void>;

  publish(tracks: Array<HMSTrack>): Promise<void>;

  unpublish(tracks: Array<HMSTrack>): Promise<void>;

  getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSTrack>>;
  getLocalScreen(settings: HMSVideoTrackSettings, onStop: () => void): Promise<HMSTrack>;
}
