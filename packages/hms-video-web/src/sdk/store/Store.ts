import { IStore, KnownRoles } from './IStore';
import HMSRoom from '../models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import { HMSSpeaker } from '../../interfaces';
import {
  HMSTrack,
  HMSVideoTrack,
  HMSAudioTrack,
  HMSTrackType,
  HMSTrackSource,
  HMSRemoteVideoTrack,
  HMSLocalTrack,
} from '../../media/tracks';
import {
  SimulcastLayer,
  SimulcastLayers,
  SimulcastDimensions,
  simulcastMapping,
  RID,
  SimulcastLayerDefinition,
} from '../../interfaces/simulcast-layers';
import { Comparator } from './Comparator';
import { HMSConfig, PublishParams } from '../../interfaces';

class Store implements IStore {
  private readonly comparator: Comparator = new Comparator(this);
  private room?: HMSRoom;
  private knownRoles: KnownRoles = {};
  private localPeerId?: string;
  private peers: Record<string, HMSPeer> = {};
  private tracks: Record<string, HMSTrack> = {};
  private speakers: HMSSpeaker[] = [];
  private videoLayers: SimulcastLayers | null = null;
  private screenshareLayers: SimulcastLayers | null = null;
  private config?: HMSConfig;
  private publishParams?: PublishParams;

  getConfig() {
    return this.config;
  }

  getPublishParams() {
    return this.publishParams;
  }

  getComparator() {
    return this.comparator;
  }

  getRoom() {
    return this.room!;
  }

  getPolicyForRole(role: string) {
    return this.knownRoles[role];
  }

  getKnownRoles() {
    return this.knownRoles;
  }

  getLocalPeer() {
    if (this.localPeerId && this.peers[this.localPeerId]) {
      return this.peers[this.localPeerId] as HMSLocalPeer;
    }
    return undefined;
  }

  getRemotePeers() {
    return Object.values(this.peers).filter((peer) => !peer.isLocal) as HMSRemotePeer[];
  }

  getPeers(): HMSPeer[] {
    return Object.values(this.peers);
  }

  getPeerById(peerId: string) {
    if (this.peers[peerId]) {
      return this.peers[peerId];
    }
    return undefined;
  }

  getTracks() {
    return Object.values(this.tracks);
  }

  getVideoTracks() {
    return this.getTracks().filter((track) => track.type === HMSTrackType.VIDEO) as HMSVideoTrack[];
  }

  getRemoteVideoTracks() {
    return this.getTracks().filter((track) => track instanceof HMSRemoteVideoTrack) as HMSRemoteVideoTrack[];
  }

  getAudioTracks() {
    return this.getTracks().filter((track) => track.type === HMSTrackType.AUDIO) as HMSAudioTrack[];
  }

  getPeerTracks(peerId?: string) {
    const peer = peerId ? this.peers[peerId] : undefined;
    const tracks: HMSTrack[] = [];
    peer?.videoTrack && tracks.push(peer.videoTrack);
    peer?.audioTrack && tracks.push(peer.audioTrack);
    return tracks.concat(peer?.auxiliaryTracks || []);
  }

  getLocalPeerTracks() {
    return this.getPeerTracks(this.localPeerId) as HMSLocalTrack[];
  }

  getTrackById(trackId: string) {
    return this.tracks[trackId];
  }

  getPeerByTrackId(trackId: string) {
    return Object.values(this.peers).find((peer) =>
      this.getPeerTracks(peer.peerId)
        .map((track) => track.trackId)
        .includes(trackId),
    );
  }

  getSpeakers() {
    return this.speakers;
  }

  getSpeakerPeers() {
    return this.speakers.map((speaker) => speaker.peer);
  }

  setRoom(room: HMSRoom) {
    this.room = room;
  }

  setKnownRoles(knownRoles: KnownRoles) {
    this.knownRoles = knownRoles;
    this.updatePeersPolicy();
  }

  setConfig(config: HMSConfig) {
    this.config = config;
  }

  setPublishParams(params: PublishParams) {
    this.publishParams = params;
  }

  addPeer(peer: HMSPeer) {
    this.peers[peer.peerId] = peer;
    if (peer.isLocal) this.localPeerId = peer.peerId;
  }

  addTrack(track: HMSTrack) {
    this.tracks[track.trackId] = track;
  }

  removePeer(peerId: string) {
    if (this.localPeerId === peerId) this.localPeerId = undefined;
    delete this.peers[peerId];
  }

  removeTrack(trackId: string) {
    delete this.tracks[trackId];
  }

  updateSpeakers(speakers: HMSSpeaker[]) {
    this.speakers = speakers;
  }

  updateAudioOutputVolume(value: number) {
    this.getAudioTracks().forEach((track) => track.setVolume(value));
  }

  updateAudioOutputDevice(device: MediaDeviceInfo) {
    this.getAudioTracks().forEach((track) => {
      track.setOutputDevice(device);
    });
  }

  getSubscribeDegradationParams() {
    const params = this.getLocalPeer()?.role?.subscribeParams.subscribeDegradation;
    if (params && Object.keys(params).length > 0) {
      return params;
    }
    return undefined;
  }

  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[] {
    if (source === 'screen') {
      return this.screenshareLayers?.layers || [];
    }
    return this.videoLayers?.layers || [];
  }

  getSimulcastDimensions(source: HMSTrackSource): SimulcastDimensions {
    const layers = source === 'screen' ? this.screenshareLayers : this.videoLayers;
    const width = layers?.width;
    const height = layers?.height;
    return {
      width,
      height,
    };
  }

  setVideoSimulcastLayers(simulcastLayers: SimulcastLayers): void {
    this.videoLayers = simulcastLayers;
  }

  setScreenshareSimulcastLayers(simulcastLayers: SimulcastLayers): void {
    this.screenshareLayers = simulcastLayers;
  }

  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource) {
    if (!peer.role) return [];

    const publishParams = this.getPolicyForRole(peer.role.name).publishParams;
    let simulcastLayers: SimulcastLayers | undefined;
    if (source === 'regular') {
      simulcastLayers = publishParams.videoSimulcastLayers;
    } else if (source === 'screen') {
      simulcastLayers = publishParams.screenSimulcastLayers;
    }
    if (!simulcastLayers || !simulcastLayers.layers || simulcastLayers.layers.length === 0) {
      return [];
    }
    const width = simulcastLayers.width;
    const height = simulcastLayers.height;
    return simulcastLayers.layers.map((value) => {
      const layer = simulcastMapping[value.rid as RID];
      const resolution = {
        width: width && value.scaleResolutionDownBy ? width / value.scaleResolutionDownBy : undefined,
        height: height && value.scaleResolutionDownBy ? height / value.scaleResolutionDownBy : undefined,
      };
      return {
        layer,
        resolution,
      } as SimulcastLayerDefinition;
    });
  }

  cleanUp() {
    const tracks = this.getTracks();
    for (const track of tracks) {
      track.cleanup();
    }
  }

  private updatePeersPolicy() {
    this.getPeers().forEach((peer) => {
      peer.role = this.getPolicyForRole(peer.role!.name);
    });
  }
}

export { Store };
