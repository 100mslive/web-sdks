import { HMSPeer, HMSPeerInit } from './HMSPeer';
import { HMSRemotePeer as IHMSRemotePeer } from '../../../interfaces/peer';
import { HMSRemoteAudioTrack, HMSRemoteTrack, HMSRemoteVideoTrack } from '../../../media/tracks';

type HMSRemotePeerInit = Omit<HMSPeerInit, 'isLocal'>;

export class HMSRemotePeer extends HMSPeer implements IHMSRemotePeer {
  isLocal = false;
  declare audioTrack?: HMSRemoteAudioTrack;
  declare videoTrack?: HMSRemoteVideoTrack;
  auxiliaryTracks: HMSRemoteTrack[] = [];
  fromRoomState = false;

  constructor(peerData: HMSRemotePeerInit) {
    super({ ...peerData, isLocal: false });
    this.fromRoomState = !!peerData.fromRoomState;
  }
}
