import HMSMediaStream from "../streams/HMSMediaStream";
import {HMSTrackType} from "./HMSTrackType";

export default abstract class HMSTrack {
  readonly trackId: string;
  readonly stream: HMSMediaStream;

  /** Changes only when un-muting the local track
   * i.e replacing the nativeTrack with different `deviceId`
   * track. */
  nativeTrack: MediaStreamTrack;

  readonly abstract type: HMSTrackType

  public get enabled(): boolean {
    return this.nativeTrack.enabled;
  }

  async setEnabled(value: boolean): Promise<void> {
    this.nativeTrack.enabled = value;
  }

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack) {
    this.stream = stream;
    this.nativeTrack = track;
    this.trackId = track.id;
  }
}