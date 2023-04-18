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
import { PolicyParams, TrackState } from '../../notification-manager';
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
  getErrorListener(): IErrorListener | undefined;

  getRoom(): HMSRoom | undefined;
  getPolicyForRole(role: string): HMSRole;
  getKnownRoles(): KnownRoles;
  getTemplateAppData(): Record<string, string> | undefined;
  setSimulcastEnabled(enabled: boolean): void;
  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[];
  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource): HMSSimulcastLayerDefinition[];

  getLocalPeer(): HMSLocalPeer | undefined;
  getRemotePeers(): HMSRemotePeer[];
  getPeers(): HMSPeer[];

  getTracksMap(): Map<HMSTrack, HMSTrack>;
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
  setKnownRoles(params: PolicyParams): void;
  setConfig(config: HMSConfig): void;
  setErrorListener(listener: IErrorListener): void;

  addPeer(peer: HMSPeer): void;
  addTrack(track: HMSTrack): void;
  hasTrack(track: HMSTrack): boolean;

  getTrackState(trackId: string): TrackStateEntry;
  setTrackState(trackState: TrackStateEntry): void;

  getUserAgent(): string;
  createAndSetUserAgent(frameworkInfo?: HMSFrameworkInfo): void;

  removePeer(peerId: string): void;
  removeTrack(track: HMSTrack): void;

  updateSpeakers(speakers: HMSSpeaker[]): void;
  updateAudioOutputVolume(volume: number): void;
  updateAudioOutputDevice(device: MediaDeviceInfo): Promise<void>;

  hasRoleDetailsArrived(): boolean;

  cleanUp(): void;
}
