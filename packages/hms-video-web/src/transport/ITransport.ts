import HMSTrack from '../media/tracks/HMSTrack';
import HMSTrackSettings from '../media/settings/HMSTrackSettings';
import HMSVideoTrackSettings from '../media/settings/HMSVideoTrackSettings';
import { HMSLocalTrack } from '../media/streams/HMSLocalStream';
import HMSLocalVideoTrack from '../media/tracks/HMSLocalVideoTrack';

// For AV track, we could get a normal track(true), empty track(empty) or no track at all(false)
export type IFetchTrackOptions = boolean | 'empty';
export interface IFetchAVTrackOptions {
  audio: IFetchTrackOptions;
  video: IFetchTrackOptions;
}

export default interface ITransport {
  join(authToken: string, peerId: string, customData: Object, initEndpoint?: string): Promise<void>;

  leave(): Promise<void>;

  publish(tracks: Array<HMSTrack>): Promise<void>;

  unpublish(tracks: Array<HMSTrack>): Promise<void>;

  getLocalTracks(settings: HMSTrackSettings): Promise<Array<HMSLocalTrack>>;
  getEmptyLocalTracks(
    fetchTrackOptions?: IFetchAVTrackOptions,
    settings?: HMSTrackSettings,
  ): Promise<Array<HMSLocalTrack>>;
  getLocalScreen(settings: HMSVideoTrackSettings, onStop: () => void): Promise<HMSLocalVideoTrack>;
}
