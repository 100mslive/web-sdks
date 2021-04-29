import HMSMediaStream from '../streams/HMSMediaStream';
import { HMSTrackType } from './HMSTrackType';

export default abstract class HMSTrack {
  // @internal
  readonly stream: HMSMediaStream;
  source?: string;

  /** Changes only when un-muting the local track
   * i.e replacing the nativeTrack with different `deviceId`
   * track.
   * @internal */
  nativeTrack: MediaStreamTrack;

  abstract readonly type: HMSTrackType;

  public get enabled(): boolean {
    return this.nativeTrack.enabled;
  }

  public get trackId(): string {
    return this.nativeTrack.id;
  }

  async setEnabled(value: boolean): Promise<void> {
    this.nativeTrack.enabled = value;
  }

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    this.stream = stream;
    this.nativeTrack = track;
    this.source = source;
  }
}
