import HMSTrack, { HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSMediaStream from '../streams/HMSMediaStream';

export default class HMSVideoTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.VIDEO;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'video') throw new Error("Expected 'track' kind = 'video'");
  }

  addSink(videoElement: HTMLVideoElement) {
    videoElement.srcObject = new MediaStream([this.nativeTrack]);
  }

  removeSink(videoElement: HTMLVideoElement) {
    videoElement.srcObject = null;
  }
}
