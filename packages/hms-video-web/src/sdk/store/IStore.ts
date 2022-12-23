import { Comparator } from './Comparator';
import { HMSConfig, HMSFrameworkInfo, HMSRole, HMSRoom, HMSSpeaker, PublishParams } from '../../interfaces';
import { IErrorListener } from '../../interfaces/error-listener';
import { HMSSimulcastLayerDefinition, SimulcastLayer } from '../../interfaces/simulcast-layers';
import {
  HMSAudioTrack,
  HMSLocalTrack,
  HMSRemoteVideoTrack,
  HMSTrack,
  HMSTrackSource,
  HMSVideoTrack,
} from '../../media/tracks';
import { TrackState } from '../../notification-manager';
import { ENV } from '../../utils/support';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';

export type KnownRoles = { [role: string]: HMSRole };
export interface TrackStateEntry {
  peerId: string;
  trackInfo: TrackState;
}

export interface IStore {
  getConfig(): HMSConfig | undefined;
  getEnv(): ENV;
  getPublishParams(): PublishParams | undefined;

  getComparator(): Comparator;

  getRoom(): HMSRoom;
  getPolicyForRole(role: string): HMSRole;
  getKnownRoles(): KnownRoles;
  setSimulcastEnabled(enabled: boolean): void;
  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[];
  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource): HMSSimulcastLayerDefinition[];

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
  setConfig(config: HMSConfig): void;
  setPublishParams(params: PublishParams): void;
  setErrorListener(listener: IErrorListener): void;

  addPeer(peer: HMSPeer): void;
  addTrack(track: HMSTrack): void;

  getTrackState(trackId: string): TrackStateEntry;
  setTrackState(trackState: TrackStateEntry): void;

  getUserAgent(): string;
  createAndSetUserAgent(frameworkInfo?: HMSFrameworkInfo): void;

  removePeer(peerId: string): void;
  removeTrack(trackId: string): void;

  updateSpeakers(speakers: HMSSpeaker[]): void;
  updateAudioOutputVolume(volume: number): void;
  updateAudioOutputDevice(device: MediaDeviceInfo): Promise<void>;

  hasRoleDetailsArrived(): boolean;

  cleanUp(): void;
}
