import { IStore, KnownRoles } from './IStore';
import HMSRoom from '../models/HMSRoom';
import { HMSLocalPeer, HMSPeer, HMSRemotePeer } from '../models/peer';
import { HMSSpeaker } from '../../interfaces/speaker';
import { HMSTrack, HMSVideoTrack, HMSAudioTrack, HMSTrackType, HMSTrackSource } from '../../media/tracks';
import { HMSLocalTrack } from '../../media/streams/HMSLocalStream';
import { SimulcastLayer, SimulcastLayers, SimulcastDimensions } from '../../interfaces/simulcast-layers';

class Store implements IStore {
  private room?: HMSRoom;
  private knownRoles: KnownRoles = {};
  private localPeerId?: string;
  private peers: Record<string, HMSPeer> = {};
  private tracks: Record<string, HMSTrack> = {};
  private speakers: HMSSpeaker[] = [];
  private videoLayers: SimulcastLayers | null = null;
  private screenshareLayers: SimulcastLayers | null = null;

  getRoom() {
    return this.room!;
  }

  getPolicyForRole(role: string) {
    return this.knownRoles[role];
  }

  getLocalPeer() {
    return this.peers[this.localPeerId!] as HMSLocalPeer;
  }

  getRemotePeers() {
    return Object.values(this.peers).filter((peer) => !peer.isLocal) as HMSRemotePeer[];
  }

  getPeers(): HMSPeer[] {
    return Object.values(this.peers);
  }

  getPeerById(peerId: string) {
    return this.peers[peerId];
  }

  getTracks() {
    return Object.values(this.tracks);
  }

  getVideoTracks() {
    return this.getTracks().filter((track) => track.type === HMSTrackType.VIDEO) as HMSVideoTrack[];
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
    this.getAudioTracks().forEach((track) => track.setOutputDevice(device));
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
    const height = layers?.width;
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

  cleanUp() {
    this.room = undefined;
    this.localPeerId = undefined;
    this.peers = {};
    this.tracks = {};
    this.speakers = [];
  }

  private updatePeersPolicy() {
    this.getPeers().forEach((peer) => {
      peer.policy = this.getPolicyForRole(peer.role!);
    });
  }

  comparators = {
    peer: {
      videoEnabled: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(Boolean(peerA.videoTrack?.enabled), Boolean(peerB.videoTrack?.enabled)),

      audioEnabled: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(Boolean(peerA.audioTrack?.enabled), Boolean(peerB.audioTrack?.enabled)),

      screenShare: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<boolean>(
          peerA.auxiliaryTracks.some((track) => track.source === 'screen'),
          peerB.auxiliaryTracks.some((track) => track.source === 'screen'),
        ),
      speaker: (peerA: HMSPeer, peerB: HMSPeer) =>
        this.primitiveComparator<number>(
          this.speakers.find((speaker) => speaker.peer.peerId === peerA.peerId)?.audioLevel || -1,
          this.speakers.find((speaker) => speaker.peer.peerId === peerB.peerId)?.audioLevel || -1,
        ),

      // @TODO: Get role priority number after adding HMSRole to HMSPeer
      rolePriority: () => 1,
    },
    track: {
      video: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(trackA.type === HMSTrackType.VIDEO, trackB.type === HMSTrackType.VIDEO),
      audio: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(trackA.type === HMSTrackType.AUDIO, trackB.type === HMSTrackType.AUDIO),
      enabled: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<boolean>(Boolean(trackA.enabled), Boolean(trackB.enabled)),

      speaker: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator<number>(
          this.speakers.find((speaker) => speaker.track.trackId === trackA.trackId)?.audioLevel || -1,
          this.speakers.find((speaker) => speaker.track.trackId === trackB.trackId)?.audioLevel || -1,
        ),
      screenShare: (trackA: HMSTrack, trackB: HMSTrack) =>
        this.primitiveComparator(trackA.source === 'screen', trackB.source === 'screen'),

      // @TODO: Get role priority number after adding HMSRole to HMSPeer
      rolePriority: () => 1,
    },
  };

  /**
   * @returns 0 if primitives are equal, 1 if a is greater and -1 if b is greater
   */
  private primitiveComparator<T>(a: T, b: T): number {
    return a === b ? 0 : Number(a) - Number(b);
  }
}

const store = new Store();
export { store };
