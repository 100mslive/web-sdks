import HMSMediaStream from '../streams/HMSMediaStream';
import { HMSTrackType } from './HMSTrackType';

export type HMSTrackSource = 'regular' | 'screen' | 'plugin';

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

  /** For remote tracks track.trackId should return the
   * track ID from SDP to maintain consistency with the server.
   * Firefox has known track ID mismatch issues.
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
}
