import HMSTrack from '../tracks/HMSTrack';

/** @internal */
export default class HMSMediaStream {
  readonly nativeStream: MediaStream;
  readonly id: string;

  readonly tracks = new Array<HMSTrack>();

  constructor(nativeStream: MediaStream) {
    this.nativeStream = nativeStream;
    this.id = nativeStream.id;
  }
}
