import { IStore, KnownRoles, TrackStateEntry } from './IStore';
import HMSRoom from '../models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import { HMSSpeaker } from '../../interfaces';
import { IErrorListener } from '../../interfaces/error-listener';
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
import { SelectedDevices } from '../../device-manager';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { ErrorFactory, HMSAction } from '../../error/ErrorFactory';

class Store implements IStore {
  private readonly comparator: Comparator = new Comparator(this);
  private room?: HMSRoom;
  private knownRoles: KnownRoles = {};
  private localPeerId?: string;
  private peers: Record<string, HMSPeer> = {};
  private tracks: Record<string, HMSTrack> = {};
  // Not used currently. Will be used exclusively for preview tracks.
  // private previewTracks: Record<string, HMSTrack> = {};
  private peerTrackStates: Record<string, TrackStateEntry> = {};
  private speakers: HMSSpeaker[] = [];
  private videoLayers: SimulcastLayers | null = null;
  private screenshareLayers: SimulcastLayers | null = null;
  private config?: HMSConfig;
  private publishParams?: PublishParams;
  private errorListener?: IErrorListener;
  private roleDetailsArrived = false;

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
    return Object.values(this.peers).filter(peer => !peer.isLocal) as HMSRemotePeer[];
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

  getTracksMap() {
    return this.tracks;
  }

  getTracks() {
    return Object.values(this.tracks);
  }

  getVideoTracks() {
    return this.getTracks().filter(track => track.type === HMSTrackType.VIDEO) as HMSVideoTrack[];
  }

  getRemoteVideoTracks() {
    return this.getTracks().filter(track => track instanceof HMSRemoteVideoTrack) as HMSRemoteVideoTrack[];
  }

  getAudioTracks() {
    return this.getTracks().filter(track => track.type === HMSTrackType.AUDIO) as HMSAudioTrack[];
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
    const track = this.tracks[trackId];
    if (track) {
      return track;
    }
    const localPeer = this.getLocalPeer();
    /**
     * handle case of audio level coming from server for local peer's track where local peer
     * didn't initially gave audio permission. So track.firstTrackId is that of dummy track and
     * this.tracks[trackId] doesn't exist.
     * Example repro which this solves -
     * - call preview with audio muted, unmute audio in preview then join the room, now initial
     * track id is that from dummy track but the track id which server knows will be different
     */
    if (localPeer) {
      if (localPeer.audioTrack?.isPublishedTrackId(trackId)) {
        return localPeer.audioTrack;
      } else if (localPeer.videoTrack?.isPublishedTrackId(trackId)) {
        return localPeer.videoTrack;
      }
    }
    return undefined;
  }

  getPeerByTrackId(trackId: string) {
    const track = this.tracks[trackId];
    return track.peerId ? this.peers[track.peerId] : undefined;
  }

  getSpeakers() {
    return this.speakers;
  }

  getSpeakerPeers() {
    return this.speakers.map(speaker => speaker.peer);
  }

  setRoom(room: HMSRoom) {
    this.room = room;
  }

  setKnownRoles(knownRoles: KnownRoles) {
    this.knownRoles = knownRoles;
    this.roleDetailsArrived = true;
    this.updatePeersPolicy();
  }

  hasRoleDetailsArrived(): boolean {
    return this.roleDetailsArrived;
  }

  // eslint-disable-next-line complexity
  setConfig(config: HMSConfig) {
    DeviceStorageManager.rememberDevices(Boolean(config.rememberDeviceSelection));
    if (config.rememberDeviceSelection) {
      const devices: SelectedDevices | undefined = DeviceStorageManager.getSelection();
      if (devices) {
        if (!config.settings) {
          config.settings = {};
        }
        if (devices.audioInput?.deviceId) {
          config.settings.audioInputDeviceId = config.settings.audioInputDeviceId || devices.audioInput.deviceId;
        }
        if (devices.audioOutput?.deviceId) {
          config.settings.audioOutputDeviceId = config.settings.audioOutputDeviceId || devices.audioOutput.deviceId;
        }
        if (devices.videoInput?.deviceId) {
          config.settings.videoDeviceId = config.settings.videoDeviceId || devices.videoInput.deviceId;
        }
      }
    }
    this.config = config;
  }

  setPublishParams(params: PublishParams) {
    this.publishParams = params;
  }

  addPeer(peer: HMSPeer) {
    this.peers[peer.peerId] = peer;
    if (peer.isLocal) {
      this.localPeerId = peer.peerId;
    }
  }

  /**
   * @param {HMSTrack} track the published track that has to be added
   *
   * Note: Only use this method to add published tracks not preview traks
   */
  addTrack(track: HMSTrack) {
    this.tracks[track.trackId] = track;
  }

  getTrackState(trackId: string) {
    return this.peerTrackStates[trackId];
  }

  setTrackState(trackStateEntry: TrackStateEntry) {
    this.peerTrackStates[trackStateEntry.trackInfo.track_id] = trackStateEntry;
  }

  removePeer(peerId: string) {
    if (this.localPeerId === peerId) {
      this.localPeerId = undefined;
    }
    delete this.peers[peerId];
  }

  removeTrack(trackId: string) {
    delete this.tracks[trackId];
  }

  updateSpeakers(speakers: HMSSpeaker[]) {
    this.speakers = speakers;
  }

  updateAudioOutputVolume(value: number) {
    this.getAudioTracks().forEach(track => track.setVolume(value));
  }

  updateAudioOutputDevice(device: MediaDeviceInfo) {
    this.getAudioTracks().forEach(track => {
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

  /**
   * Convert maxBitrate from kbps to bps
   * @internal
   * @param simulcastLayers
   * @returns {SimulcastLayers}
   */
  private convertSimulcastLayers(simulcastLayers: SimulcastLayers) {
    return {
      ...simulcastLayers,
      layers: (simulcastLayers.layers || []).map(layer => {
        return {
          ...layer,
          maxBitrate: layer.maxBitrate * 1000,
        };
      }),
    };
  }

  setVideoSimulcastLayers(simulcastLayers: SimulcastLayers): void {
    this.videoLayers = this.convertSimulcastLayers(simulcastLayers);
  }

  setScreenshareSimulcastLayers(simulcastLayers: SimulcastLayers): void {
    this.screenshareLayers = this.convertSimulcastLayers(simulcastLayers);
  }

  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource) {
    if (!peer.role) {
      return [];
    }

    const publishParams = this.getPolicyForRole(peer.role.name).publishParams;
    let simulcastLayers: SimulcastLayers | undefined;
    if (source === 'regular') {
      simulcastLayers = publishParams.videoSimulcastLayers;
    } else if (source === 'screen') {
      simulcastLayers = publishParams.screenSimulcastLayers;
    }
    const width = simulcastLayers?.width;
    const height = simulcastLayers?.height;
    return (
      simulcastLayers?.layers?.map(value => {
        const layer = simulcastMapping[value.rid as RID];
        const resolution = {
          width: width && value.scaleResolutionDownBy ? width / value.scaleResolutionDownBy : undefined,
          height: height && value.scaleResolutionDownBy ? height / value.scaleResolutionDownBy : undefined,
        };
        return {
          layer,
          resolution,
        } as SimulcastLayerDefinition;
      }) || []
    );
  }

  cleanUp() {
    const tracks = this.getTracks();
    for (const track of tracks) {
      track.cleanup();
    }
    this.config = undefined;
    this.localPeerId = undefined;
    this.roleDetailsArrived = false;
  }

  setErrorListener(listener: IErrorListener) {
    this.errorListener = listener;
  }

  private updatePeersPolicy() {
    this.getPeers().forEach(peer => {
      if (!peer.role) {
        this.errorListener?.onError(ErrorFactory.GenericErrors.InvalidRole(HMSAction.VALIDATION, ''));
        return;
      }
      peer.role = this.getPolicyForRole(peer.role.name);
    });
  }
}

export { Store };
