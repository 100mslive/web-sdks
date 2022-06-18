import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';
import { DeviceChangeListener } from './device-change-listener';
import { HMSPeer } from './peer';
import { HMSPeerListUpdate } from './peer-list-update';
import { HMSRoom } from './room';
import { HMSRoomUpdate, HMSPeerUpdate } from './update-listener';

export interface HMSPreviewListener extends DeviceChangeListener {
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
  onError(exception: HMSException): void;
  onReconnecting(error: HMSException): void;
  onReconnected(): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer | null): void;
  onPeerListUpdate(peerListUpdate: HMSPeerListUpdate): void;
  onNetworkQuality?(score: number): void;
}
