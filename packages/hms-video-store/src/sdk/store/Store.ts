import { KnownRoles, TrackStateEntry } from './StoreInterfaces';
import { HTTPAnalyticsTransport } from '../../analytics/HTTPAnalyticsTransport';
import { DeviceStorageManager } from '../../device-manager/DeviceStorage';
import { ErrorFactory } from '../../error/ErrorFactory';
import { HMSAction } from '../../error/HMSAction';
import { HMSConfig, HMSFrameworkInfo, HMSPermissionType, HMSPoll, HMSSpeaker, HMSWhiteboard } from '../../interfaces';
import { SelectedDevices } from '../../interfaces/devices';
import { IErrorListener } from '../../interfaces/error-listener';
import {
  HMSSimulcastLayerDefinition,
  RID,
  SimulcastLayer,
  SimulcastLayers,
  simulcastMapping,
} from '../../interfaces/simulcast-layers';
import {
  HMSAudioTrack,
  HMSLocalTrack,
  HMSRemoteAudioTrack,
  HMSRemoteVideoTrack,
  HMSTrack,
  HMSTrackSource,
  HMSTrackType,
  HMSVideoTrack,
} from '../../media/tracks';
import { PolicyParams } from '../../notification-manager';
import HMSLogger from '../../utils/logger';
import { ENV } from '../../utils/support';
import { createUserAgent } from '../../utils/user-agent';
import HMSRoom from '../models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';

class Store {
  private TAG = '[Store]:';
  private room?: HMSRoom;
  private knownRoles: KnownRoles = {};
  private localPeerId?: string;
  private peers: Record<string, HMSPeer> = {};
  private tracks = new Map<HMSTrack, HMSTrack>();
  private templateAppData?: Record<string, string>;
  // Not used currently. Will be used exclusively for preview tracks.
  // private previewTracks: Record<string, HMSTrack> = {};
  private peerTrackStates: Record<string, TrackStateEntry> = {};
  private speakers: HMSSpeaker[] = [];
  private videoLayers?: SimulcastLayers;
  // private screenshareLayers?: SimulcastLayers;
  private config?: HMSConfig;
  private errorListener?: IErrorListener;
  private roleDetailsArrived = false;
  private env: ENV = ENV.PROD;
  private simulcastEnabled = false;
  private userAgent: string = createUserAgent(this.env);
  private polls = new Map<string, HMSPoll>();
  private whiteboards = new Map<string, HMSWhiteboard>();

  getConfig() {
    return this.config;
  }

  setSimulcastEnabled(enabled: boolean) {
    this.simulcastEnabled = enabled;
  }

  getEnv() {
    return this.env;
  }

  getPublishParams() {
    const peer = this.getLocalPeer();
    const role = peer?.asRole || peer?.role;
    return role?.publishParams;
  }

  getRoom() {
    return this.room;
  }

  getPolicyForRole(role: string) {
    return this.knownRoles[role];
  }

  getKnownRoles() {
    return this.knownRoles;
  }

  getTemplateAppData() {
    return this.templateAppData;
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

  getPeerMap() {
    return this.peers;
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
    return Array.from(this.tracks.values());
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

  hasTrack(track: HMSTrack) {
    return this.tracks.has(track);
  }

  getTrackById(trackId: string) {
    const track = Array.from(this.tracks.values()).find(track => track.trackId === trackId);
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
    const track = Array.from(this.tracks.values()).find(track => track.trackId === trackId);
    return track?.peerId ? this.peers[track.peerId] : undefined;
  }

  getSpeakers() {
    return this.speakers;
  }

  getSpeakerPeers() {
    return this.speakers.map(speaker => speaker.peer);
  }

  getUserAgent() {
    return this.userAgent;
  }

  createAndSetUserAgent(frameworkInfo?: HMSFrameworkInfo) {
    this.userAgent = createUserAgent(this.env, frameworkInfo);
  }

  setRoom(room: HMSRoom) {
    this.room = room;
  }

  setKnownRoles(params: PolicyParams) {
    this.knownRoles = params.known_roles;
    this.addPluginsToRoles(params.plugins);
    this.roleDetailsArrived = true;
    this.templateAppData = params.app_data;
    if (!this.simulcastEnabled) {
      return;
    }
    const publishParams = this.knownRoles[params.name]?.publishParams;
    this.videoLayers = this.convertSimulcastLayers(publishParams.simulcast?.video);
    // this.screenshareLayers = this.convertSimulcastLayers(publishParams.simulcast?.screen);
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
    config.autoManageVideo = config.autoManageVideo !== false;
    config.autoManageWakeLock = config.autoManageWakeLock !== false;
    this.config = config;
    this.setEnv();
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
    this.tracks.set(track, track);
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

  removeTrack(track: HMSTrack) {
    this.tracks.delete(track);
  }

  updateSpeakers(speakers: HMSSpeaker[]) {
    this.speakers = speakers;
  }

  async updateAudioOutputVolume(value: number) {
    for (const track of this.getAudioTracks()) {
      await track.setVolume(value);
    }
  }

  async updateAudioOutputDevice(device: MediaDeviceInfo) {
    const promises: Promise<void>[] = [];
    this.getAudioTracks().forEach(track => {
      if (track instanceof HMSRemoteAudioTrack) {
        promises.push(track.setOutputDevice(device));
      }
    });
    await Promise.all(promises);
  }

  getSimulcastLayers(source: HMSTrackSource): SimulcastLayer[] {
    // Enable only when backend enables and source is video or screen. ignore videoplaylist
    if (!this.simulcastEnabled || !['screen', 'regular'].includes(source)) {
      return [];
    }
    if (source === 'screen') {
      return []; //this.screenshareLayers?.layers || []; uncomment this when screenshare simulcast supported
    }
    return this.videoLayers?.layers || [];
  }

  /**
   * Convert maxBitrate from kbps to bps
   * @internal
   * @param simulcastLayers
   * @returns {SimulcastLayers}
   */
  private convertSimulcastLayers(simulcastLayers?: SimulcastLayers) {
    if (!simulcastLayers) {
      return;
    }
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

  getSimulcastDefinitionsForPeer(peer: HMSPeer, source: HMSTrackSource) {
    // TODO: remove screen check when screenshare simulcast is supported
    if ([!peer || !peer.role, source === 'screen', !this.simulcastEnabled].some(value => !!value)) {
      return [];
    }

    const publishParams = this.getPolicyForRole(peer.role!.name).publishParams;
    let simulcastLayers: SimulcastLayers | undefined;
    let width: number;
    let height: number;
    if (source === 'regular') {
      simulcastLayers = publishParams.simulcast?.video;
      width = publishParams.video.width;
      height = publishParams.video.height;
    } else if (source === 'screen') {
      simulcastLayers = publishParams.simulcast?.screen;
      width = publishParams.screen.width;
      height = publishParams.screen.height;
    }
    return (
      simulcastLayers?.layers?.map(value => {
        const layer = simulcastMapping[value.rid as RID];
        const resolution = {
          width: Math.floor(width / value.scaleResolutionDownBy),
          height: Math.floor(height / value.scaleResolutionDownBy),
        };
        return {
          layer,
          resolution,
        } as HMSSimulcastLayerDefinition;
      }) || []
    );
  }

  setPoll(poll: HMSPoll) {
    this.polls.set(poll.id, poll);
  }

  getPoll(id: string): HMSPoll | undefined {
    return this.polls.get(id);
  }

  setWhiteboard(whiteboard: HMSWhiteboard) {
    this.whiteboards.set(whiteboard.id, whiteboard);
  }

  getWhiteboards() {
    return this.whiteboards;
  }

  getWhiteboard(id?: string): HMSWhiteboard | undefined {
    return id ? this.whiteboards.get(id) : this.whiteboards.values().next().value;
  }

  getErrorListener() {
    return this.errorListener;
  }

  cleanup() {
    const tracks = this.getTracks();
    for (const track of tracks) {
      track.cleanup();
    }
    this.room = undefined;
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
  private addPluginsToRoles(plugins: PolicyParams['plugins']) {
    if (!plugins) {
      return;
    }

    const addPermissionToRole = (
      role: string,
      pluginName: keyof PolicyParams['plugins'],
      permission: HMSPermissionType,
    ) => {
      if (!this.knownRoles[role]) {
        HMSLogger.d(this.TAG, `role ${role} is not present in given roles`, this.knownRoles);
        return;
      }
      const rolePermissions = this.knownRoles[role].permissions;
      if (!rolePermissions[pluginName]) {
        rolePermissions[pluginName] = [];
      }
      rolePermissions[pluginName]?.push(permission);
    };

    Object.keys(plugins).forEach(plugin => {
      const pluginName = plugin as keyof PolicyParams['plugins'];
      if (!plugins[pluginName]) {
        return;
      }

      const permissions = plugins[pluginName].permissions;
      permissions?.admin?.forEach(role => addPermissionToRole(role, pluginName, 'admin'));
      permissions?.reader?.forEach(role => addPermissionToRole(role, pluginName, 'read'));
      permissions?.writer?.forEach(role => addPermissionToRole(role, pluginName, 'write'));
    });
  }
  private setEnv() {
    const endPoint = this.config?.initEndpoint!;
    const url = endPoint.split('https://')[1];
    let env: ENV = ENV.PROD;
    if (url.startsWith(ENV.PROD)) {
      env = ENV.PROD;
    } else if (url.startsWith(ENV.QA)) {
      env = ENV.QA;
    } else if (url.startsWith(ENV.DEV)) {
      env = ENV.DEV;
    }
    this.env = env;
    HTTPAnalyticsTransport.setEnv(env);
  }
}

export { Store };
