import { HMSRoom, HMSSpeaker, HMSRole, PublishParams, HMSConfig } from '../../interfaces';
import {
  HMSTrack,
  HMSAudioTrack,
  HMSVideoTrack,
  HMSTrackSource,
  HMSRemoteVideoTrack,
  HMSLocalTrack,
} from '../../media/tracks';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import {
  SimulcastLayer,
  SimulcastDimensions,
  SimulcastLayers,
  SimulcastLayerDefinition,
} from '../../interfaces/simulcast-layers';
import { SubscribeDegradationParams } from '../../interfaces/subscribe-degradation-params';
import { Comparator } from './Comparator';
import { TrackState } from '../../notification-manager';
import { IErrorListener } from '../../interfaces/error-listener';

export type KnownRoles = { [role: string]: HMSRole };
export interface TrackStateEntry {
  peerId: string;
  trackInfo: TrackState;
}

export interface IStore {
  getConfig(): HMSConfig | undefined;
  getPublishParams(): PublishParams | undefined;

  getComparator(): Comparator;

  getRoom(): HMSRoom;
  getPolicyForRole(role: string): HMSRole;
  getKnownRoles(): KnownRoles;
  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[];
  getSimulcastDimensions(source: HMSTrackSource): SimulcastDimensions | undefined;
  getSubscribeDegradationParams(): SubscribeDegradationParams | undefined;
  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource): SimulcastLayerDefinition[];

  getLocalPeer(): HMSLocalPeer | undefined;
  getRemotePeers(): HMSRemotePeer[];
  getPeers(): HMSPeer[];

  getTracksMap(): Record<string, HMSTrack>;
  getTracks(): HMSTrack[];
  getVideoTracks(): HMSVideoTrack[];
  getAudioTracks(): HMSAudioTrack[];
  getRemoteVideoTracks(): HMSRemoteVideoTrack[];

  getPeerById(peerId: string): HMSPeer | undefined;
  getTrackById(trackId: string): HMSTrack | undefined;
  getPeerByTrackId(trackId: string): HMSPeer | undefined;
  getPeerTracks(peerId: string): HMSTrack[];
  getLocalPeerTracks(): HMSLocalTrack[];

  getSpeakers(): HMSSpeaker[];
  getSpeakerPeers(): HMSPeer[];

  setRoom(room: HMSRoom): void;
  setKnownRoles(knownRoles: KnownRoles): void;
  setVideoSimulcastLayers(layers: SimulcastLayers): void;
  setScreenshareSimulcastLayers(layers: SimulcastLayers): void;
  setConfig(config: HMSConfig): void;
  setPublishParams(params: PublishParams): void;
  setErrorListener(listener: IErrorListener): void;

  addPeer(peer: HMSPeer): void;
  addTrack(track: HMSTrack): void;

  getTrackState(trackId: string): TrackStateEntry;
  setTrackState(trackState: TrackStateEntry): void;

  removePeer(peerId: string): void;
  removeTrack(trackId: string): void;

  updateSpeakers(speakers: HMSSpeaker[]): void;
  updateAudioOutputVolume(volume: number): void;
  updateAudioOutputDevice(device: MediaDeviceInfo): void;

  hasRoleDetailsArrived(): boolean;

  cleanUp(): void;
}
