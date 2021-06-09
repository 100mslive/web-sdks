import HMSTrack from '../tracks/HMSTrack';
import { normalizeMediaId } from '../../utils/media-id';

export default class HMSMediaStream {
  readonly nativeStream: MediaStream;
  readonly id: string;

  readonly tracks = new Array<HMSTrack>();

  constructor(nativeStream: MediaStream) {
    this.nativeStream = nativeStream;
    this.id = normalizeMediaId(nativeStream.id);
  }
}
