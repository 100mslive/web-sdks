import { HMSPeer } from '../sdk/models/peer';

export interface HMSPeerListUpdate {
  peers: HMSPeer[];
  peersAdded: HMSPeer[];
  peersRemoved: HMSPeer[];
  peersWithNameChanged: HMSPeer[];
  peersWithMetadataChanged: HMSPeer[];
  peersWithRoleChanged: HMSPeer[];
}
