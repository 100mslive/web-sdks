import { HMSLocalPeer as IHMSLocalPeer } from '../../../interfaces/peer';
import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack } from '../../../media/tracks';
import HMSIdFactory from '../../../utils/id-factory';

type HMSLocalPeerInit = Omit<HMSPeerInit, 'isLocal' | 'peerId'>;

export class HMSLocalPeer extends HMSPeer implements IHMSLocalPeer {
  isLocal = true;
  declare audioTrack?: HMSLocalAudioTrack;
  declare videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[] = [];

  constructor(peerData: HMSLocalPeerInit) {
    super({ ...peerData, peerId: HMSIdFactory.makePeerId(), isLocal: true });
  }
}
