import { HMSRoom } from '../../interfaces/room';
import { HMSSpeaker } from '../../interfaces/speaker';
import { HMSTrack, HMSAudioTrack, HMSVideoTrack, HMSTrackSource, HMSRemoteVideoTrack } from '../../media/tracks';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import { HMSLocalTrack } from '../../media/streams/HMSLocalStream';
import { HMSPolicy } from '../../interfaces/policy';
import { SimulcastLayer, SimulcastDimensions, SimulcastLayers } from '../../interfaces/simulcast-layers';
import { SubscribeDegradationParams } from '../../interfaces/subscribe-degradation-params';
import { Comparator } from './Comparator';

export type KnownRoles = { [role: string]: HMSPolicy };

export interface IStore {
  getComparator(): Comparator;

  getRoom(): HMSRoom;
  getPolicyForRole(role: string): HMSPolicy;
  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[];
  getSimulcastDimensions(source: HMSTrackSource): SimulcastDimensions | undefined;
  getSubscribeDegradationParams(): SubscribeDegradationParams | undefined;

  getLocalPeer(): HMSLocalPeer | undefined;
  getRemotePeers(): HMSRemotePeer[];
  getPeers(): HMSPeer[];

  getTracks(): HMSTrack[];
  getVideoTracks(): HMSVideoTrack[];
  getAudioTracks(): HMSAudioTrack[];
  getRemoteVideoTracks(): HMSRemoteVideoTrack[];

  getPeerById(peerId: string): HMSPeer;
  getTrackById(trackId: string): HMSTrack;
  getPeerByTrackId(trackId: string): HMSPeer | undefined;
  getPeerTracks(peerId: string): HMSTrack[];
  getLocalPeerTracks(): HMSLocalTrack[];

  getSpeakers(): HMSSpeaker[];
  getSpeakerPeers(): HMSPeer[];

  setRoom(room: HMSRoom): void;
  setKnownRoles(knownRoles: KnownRoles): void;
  setVideoSimulcastLayers(layers: SimulcastLayers): void;
  setScreenshareSimulcastLayers(layers: SimulcastLayers): void;

  addPeer(peer: HMSPeer): void;
  addTrack(track: HMSTrack): void;

  removePeer(peerId: string): void;
  removeTrack(trackId: string): void;

  updateSpeakers(speakers: HMSSpeaker[]): void;
  updateAudioOutputVolume(volume: number): void;
  updateAudioOutputDevice(device: MediaDeviceInfo): void;
}
