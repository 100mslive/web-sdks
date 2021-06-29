import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSLocalTrack } from '../../../media/streams/HMSLocalStream';
import HMSLocalAudioTrack from '../../../media/tracks/HMSLocalAudioTrack';
import HMSLocalVideoTrack from '../../../media/tracks/HMSLocalVideoTrack';
import HMSIdFactory from '../../../utils/id-factory';

type HMSLocalPeerInit = Omit<HMSPeerInit, 'isLocal' | 'peerId'>;

export class HMSLocalPeer extends HMSPeer {
  isLocal: boolean = true;
  audioTrack?: HMSLocalAudioTrack;
  videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[] = [];

  constructor({ name, role, customerUserId, customerDescription }: HMSLocalPeerInit) {
    super({ peerId: HMSIdFactory.makePeerId(), isLocal: true, name, role, customerUserId, customerDescription });
  }
}
