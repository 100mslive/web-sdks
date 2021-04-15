import HMSTrack from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSMediaStream from '../streams/HMSMediaStream';

export default class HMSAudioTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.AUDIO;

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack) {
    super(stream, track);
    if (track.kind !== 'audio')
      throw new Error("Expected 'track' kind = 'audio'");
  }
}
