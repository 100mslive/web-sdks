import HMSMediaStream from '../streams/HMSMediaStream';
import { HMSTrackType } from './HMSTrackType';

export type HMSTrackSource = 'regular' | 'screen' | 'plugin' | 'audioplaylist' | 'videoplaylist' | string;

export abstract class HMSTrack {
  /**
   * @internal
   */
  readonly stream: HMSMediaStream;
  source?: HMSTrackSource;

  /** Changes on mute/unmute or plugins addition and removal
   * i.e replacing the nativeTrack with different `deviceId`
   * track.
   * @internal */
  nativeTrack: MediaStreamTrack;

  /**
   * Firefox doesn't respect the track id as sent from the backend when calling peerconnection.track callback. This
   * breaks correlation of future track updates from backend. So we're storing the sdp track id as present in the
   * original offer along with the track as well and will let this override the native track id for any correlation
   * purpose.
   * @internal */
  private sdpTrackId?: string;

  abstract readonly type: HMSTrackType;

  public get enabled(): boolean {
    return this.nativeTrack.enabled;
  }

  public get trackId(): string {
    return this.sdpTrackId || this.nativeTrack.id;
  }

  getMediaTrackSettings(): MediaTrackSettings {
    return this.nativeTrack.getSettings();
  }

  async setEnabled(value: boolean): Promise<void> {
    this.nativeTrack.enabled = value;
  }

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: HMSTrackSource) {
    this.stream = stream;
    this.nativeTrack = track;
    this.source = source;
  }

  /**
   * @internal
   */
  setSdpTrackId(sdpTrackId: string) {
    this.sdpTrackId = sdpTrackId;
  }

  /**
   * @internal
   * take care of -
   * 1. https://bugs.chromium.org/p/chromium/issues/detail?id=1232649
   * 2. stopping any tracks
   * 3. plugins related cleanups and stopping
   */
  cleanup() {
    this.nativeTrack?.stop();
  }
}
