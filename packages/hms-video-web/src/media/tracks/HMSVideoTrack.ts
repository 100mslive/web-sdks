import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import { VideoElementManager } from './VideoElementManager';
import HMSLogger from '../../utils/logger';
import HMSMediaStream from '../streams/HMSMediaStream';

export class HMSVideoTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.VIDEO;
  private sinkCount = 0;
  videoHandler!: VideoElementManager;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'video') {
      throw new Error("Expected 'track' kind = 'video'");
    }
  }

  setVideoHandler(videoHandler: VideoElementManager) {
    this.videoHandler = videoHandler;
  }

  /**
   * sink=video element rendering the video
   */
  hasSinks() {
    return this.sinkCount > 0;
  }

  getSinks() {
    return this.videoHandler.getVideoElements() || [];
  }

  attach(videoElement: HTMLVideoElement) {
    this.videoHandler.addVideoElement(videoElement);
  }

  detach(videoElement: HTMLVideoElement) {
    this.videoHandler.removeVideoElement(videoElement);
  }

  /**
   * attaches the track to the passed in video element
   * @param videoElement
   */
  addSink(videoElement: HTMLVideoElement) {
    this.addSinkInternal(videoElement, this.nativeTrack);
  }

  /**
   * removes the track from the passed in video element
   * @param videoElement
   */
  removeSink(videoElement: HTMLVideoElement) {
    HMSLogger.v(`[HMSVideoTrack] removing sink video element - ${videoElement}`);
    if (videoElement.srcObject !== null) {
      videoElement.srcObject = null;
      if (this.sinkCount > 0) {
        this.sinkCount--;
      }
    }
  }

  cleanup(): void {
    super.cleanup();
    this.videoHandler.cleanup();
  }

  protected addSinkInternal(videoElement: HTMLVideoElement, track: MediaStreamTrack) {
    HMSLogger.v(`[HMSVideoTrack] adding sink internal video - ${videoElement} track - ${track}`);
    const srcObject = videoElement.srcObject;
    if (srcObject !== null && srcObject instanceof MediaStream) {
      const existingTrackID = srcObject.getVideoTracks()[0]?.id;
      if (existingTrackID === track.id) {
        // it's already attached, attaching again would just cause flickering
        return;
      }
    }
    videoElement.srcObject = new MediaStream([track]);
    this.sinkCount++;
  }
}
