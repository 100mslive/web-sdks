import HMSTrack from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSMediaStream from '../streams/HMSMediaStream';

export default class HMSVideoTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.VIDEO;

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack) {
    super(stream, track);
    if (track.kind !== 'video')
      throw new Error("Expected 'track' kind = 'video'");
  }
}
