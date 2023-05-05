import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSLocalPeer as IHMSLocalPeer } from '../../../interfaces/peer';
import { HMSRole } from '../../../interfaces/role';
import { HMSLocalAudioTrack, HMSLocalTrack, HMSLocalVideoTrack } from '../../../media/tracks';
import HMSIdFactory from '../../../utils/id-factory';

type HMSLocalPeerInit = Omit<HMSPeerInit, 'isLocal' | 'peerId'> & { asRole?: HMSRole };

export class HMSLocalPeer extends HMSPeer implements IHMSLocalPeer {
  isLocal = true;
  declare audioTrack?: HMSLocalAudioTrack;
  declare videoTrack?: HMSLocalVideoTrack;
  auxiliaryTracks: HMSLocalTrack[] = [];
  asRole?: HMSRole;

  constructor(peerData: HMSLocalPeerInit) {
    super({ ...peerData, peerId: HMSIdFactory.makePeerId(), isLocal: true });
    this.asRole = peerData.asRole;
  }

  isInPreview() {
    return !!this.asRole;
  }

  toString(): string {
    return `{
      name: ${this.name};
      role: ${this.role?.name};
      peerId: ${this.peerId};
      customerUserId: ${this.customerUserId};
      ${this.asRole ? `asRole: ${this.asRole.name};` : ''}
      ${this.audioTrack ? `audioTrack: ${this.audioTrack?.trackId};` : ''}
      ${this.videoTrack ? `videoTrack: ${this.videoTrack?.trackId};` : ''}
    }`;
  }
}
