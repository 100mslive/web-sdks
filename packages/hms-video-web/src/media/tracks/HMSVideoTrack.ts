import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import { VideoElementManager } from './VideoElementManager';
import { HMSMediaStream } from '../streams';

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
    if (videoElement.srcObject !== null) {
      videoElement.srcObject = null;
      this.reduceSinkCount();
    }
  }

  cleanup(): void {
    super.cleanup();
    this.videoHandler.cleanup();
  }

  protected addSinkInternal(videoElement: HTMLVideoElement, track: MediaStreamTrack) {
    const srcObject = videoElement.srcObject;
    if (srcObject !== null && srcObject instanceof MediaStream) {
      const existingTrack = srcObject.getVideoTracks()[0];
      if (existingTrack?.id === track.id) {
        if (!existingTrack.muted && existingTrack.readyState === 'live') {
          // it's already attached, attaching again would just cause flickering
          return;
        } else {
          this.reduceSinkCount();
        }
      } else {
        this.reduceSinkCount();
      }
    }
    videoElement.srcObject = new MediaStream([track]);
    this.sinkCount++;
  }

  private reduceSinkCount() {
    if (this.sinkCount > 0) {
      this.sinkCount--;
    }
  }
}
