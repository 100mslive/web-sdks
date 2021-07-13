import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSLocalTrack } from '../../../media/streams/HMSLocalStream';
import { HMSLocalAudioTrack, HMSLocalVideoTrack } from '../../../media/tracks';
import HMSIdFactory from '../../../utils/id-factory';

type HMSLocalPeerInit = Omit<HMSPeerInit, 'isLocal' | 'peerId'>;

export class HMSLocalPeer extends HMSPeer {
  isLocal: boolean = true;
  audioTrack?: HMSLocalAudioTrack;
  videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[] = [];

  constructor(peerData: HMSLocalPeerInit) {
    super({ ...peerData, peerId: HMSIdFactory.makePeerId(), isLocal: true });
  }
}
