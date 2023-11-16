import { HMSTrack } from '../tracks';

export class HMSMediaStream {
  readonly nativeStream: MediaStream;
  id: string;

  readonly tracks = new Array<HMSTrack>();

  constructor(nativeStream: MediaStream) {
    this.nativeStream = nativeStream;
    this.id = nativeStream.id;
  }

  /**
   * This is only used when onDemandTracks flag is enabled in Init
   * @param id
   */
  updateId(id: string) {
    this.id = id;
  }
}
