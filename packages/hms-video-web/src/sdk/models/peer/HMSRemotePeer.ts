import { HMSRemotePeer as IHMSRemotePeer } from '../../../interfaces/peer';
import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack } from '../../../media/tracks';

type HMSRemotePeerInit = Omit<HMSPeerInit, 'isLocal'>;

export class HMSRemotePeer extends HMSPeer implements IHMSRemotePeer {
  isLocal: boolean = false;
  declare audioTrack?: HMSRemoteAudioTrack;
  declare videoTrack?: HMSRemoteVideoTrack;
  auxiliaryTracks: HMSRemoteTrack[] = [];

  constructor(peerData: HMSRemotePeerInit) {
    super({ ...peerData, isLocal: false });
  }
}
