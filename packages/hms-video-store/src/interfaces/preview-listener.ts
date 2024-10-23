import { DeviceChangeListener } from './devices';
import { HMSPeer } from './peer';
import { HMSRoom } from './room';
import { HMSPeerUpdate, HMSRoomUpdate, HMSTrackUpdate } from './update-listener';
import { HMSException } from '../error/HMSException';
import { HMSTrack } from '../media/tracks/HMSTrack';

export interface HMSPreviewListener extends DeviceChangeListener {
  onPreview(room: HMSRoom, localTracks: HMSTrack[]): void;
  onError(exception: HMSException): void;
  onReconnecting(error: HMSException): void;
  onReconnected(): void;
  onRoomUpdate(type: HMSRoomUpdate, room: HMSRoom): void;
  onPeerUpdate(type: HMSPeerUpdate, peer: HMSPeer | HMSPeer[] | null): void;
  onNetworkQuality?(score: number): void;
  // This is needed to mute audio when there is an error in device change
  onTrackUpdate(type: HMSTrackUpdate, track: HMSTrack, peer: HMSPeer): void;
}
