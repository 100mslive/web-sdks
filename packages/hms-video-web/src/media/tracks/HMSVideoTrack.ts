import HMSTrack from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSMediaStream from '../streams/HMSMediaStream';
import { HMSVideoSourceType } from './HMSVideoSourceType';

export default class HMSVideoTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.VIDEO;
  readonly videoSourceType: HMSVideoSourceType;

  constructor(
    stream: HMSMediaStream,
    track: MediaStreamTrack,
    videoSourceType: HMSVideoSourceType = HMSVideoSourceType.REGULAR,
  ) {
    super(stream, track);
    if (track.kind !== 'video') throw new Error("Expected 'track' kind = 'video'");
    this.videoSourceType = videoSourceType;
  }
}
