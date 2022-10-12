import {
  HMSActions,
  IHMSStore,
  HMSPeer,
  HMSRoom,
  HMSTrackSource,
  HMSRoomState,
  HMSMessageInput,
  HMSAudioTrackSettings,
  HMSVideoTrackSettings,
  HMSConfig,
  HMSSimulcastLayer,
  selectLocalVideoTrackID,
  HMSRole,
  HMSTrackID,
} from '@100mslive/react-sdk';
import { makeFakeMessage } from '../fixtures/chats';

/*
This is a dummy bridge with no connected backend. It can be used for
storybook or writing functional tests.
 */
export class StoryBookSDK implements Partial<HMSActions> {
  private readonly store: IHMSStore;
  private videoURLs: string[] = [];
  private dummyTrackURLs: Record<string, string> = {};
  private counter = 100;
  private localPeer?: HMSPeer;
  private ignoredMessageTypes: string[] = [];

  constructor(store: IHMSStore) {
    this.store = store;
  }
  setPreferredLayer(_trackId: string, _layer: HMSSimulcastLayer): void {
    throw new Error('Method not implemented.');
  }

  setVolume(_value: number, _trackId?: string): void {
    throw new Error('Method not implemented.');
  }

  setOutputDevice(_deviceId: string) {
    throw new Error('Method not implemented');
  }

  setOutputVolume(_volume: number) {
    throw new Error('Method not implemented');
  }

  addTrack(_track: MediaStreamTrack, _type: HMSTrackSource): Promise<void> {
    throw new Error('Method not implemented.');
  }
  removeTrack(_trackId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setEnabledTrack(_trackId: string, _enabled: boolean): Promise<void> {
    throw new Error('Method not implemented.');
  }

  setMessageRead(readStatus: boolean, messageId: string): void {
    this.store.setState(store => {
      if (messageId) {
        if (!store.messages.byID[messageId]) {
          return;
        } else {
          store.messages.byID[messageId].read = readStatus;
        }
      } else {
        store.messages.allIDs.forEach((id: string) => {
          store.messages.byID[id].read = readStatus;
        });
      }
    });
  }

  async preview(config: HMSConfig) {
    if (!config.authToken) {
      this.log('invalid params');
      return;
    }
    this.log('User called preview');
    this.store.setState(store => {
      store.room.roomState = HMSRoomState.Preview;
      this.localPeer = {
        name: config?.userName,
        isLocal: true,
        id: String(this.randomNumber()),
        auxiliaryTracks: [],
      };
      store.room.peers.push(this.localPeer.id);
      store.peers[this.localPeer.id] = this.localPeer;
    });
  }

  async join(...args: any[]): Promise<void> {
    const joinParams = args[0];
    if (!(joinParams.username && joinParams.role && joinParams.roomId)) {
      this.log('invalid params');
      return;
    }
    this.log('User joining room');
    this.store.setState(store => {
      store.room.isConnected = true;
      store.room.id = joinParams.roomId;

      if (!this.localPeer) {
        this.localPeer = {
          name: joinParams?.username,
          roleName: joinParams?.roleName,
          isLocal: true,
          id: String(this.randomNumber()),
          auxiliaryTracks: [],
        };
        store.room.peers.push(this.localPeer.id);
        store.peers[this.localPeer.id] = this.localPeer;
      }
    });
  }

  async attachVideo(trackID: string, videoElement: HTMLVideoElement): Promise<void> {
    if (this.dummyTrackURLs[trackID]) {
      videoElement.src = this.dummyTrackURLs[trackID];
    }
    this.log('video attached');
  }

  async leave(): Promise<void> {
    this.log('user left room');
    this.store.setState(store => {
      store.room.isConnected = false;
    });
  }

  async detachVideo(_trackID: string, videoElement: HTMLVideoElement): Promise<void> {
    videoElement.removeAttribute('src');
    videoElement.load();
    this.log('video removed');
  }

  async sendBroadcastMessage(message: string | HMSMessageInput): Promise<void> {
    this.store.setState(store => {
      const user = 'You';
      const newMsg = makeFakeMessage(typeof message === 'string' ? message : message.message, user);
      store.messages.byID[newMsg.id] = newMsg;
      store.messages.allIDs.push(newMsg.id);
    });
    this.log('message sent - ', message);
  }

  async setLocalAudioEnabled(enabled: boolean): Promise<void> {
    this.log('set local audio enabled state - ', enabled);
  }

  async setLocalVideoEnabled(enabled: boolean): Promise<void> {
    const trackID = this.store.getState(selectLocalVideoTrackID);
    this.store.setState(state => {
      if (trackID) {
        state.tracks[trackID].enabled = enabled;
      }
    });
    this.log('set local video enabled state - ', enabled);
  }

  async setRemoteTrackEnabled(forRemoteTrackID: HMSTrackID | HMSTrackID[], enabled: boolean): Promise<void> {
    if (typeof forRemoteTrackID === 'string') {
      this.store.setState(state => {
        state.tracks[forRemoteTrackID].enabled = enabled;
      });
    }
    this.log('set local video enabled state - ', enabled);
  }

  async setScreenShareEnabled(enabled: boolean): Promise<void> {
    this.log('set screenshare enabled state - ', enabled);
  }

  addTestRoom(room: Partial<HMSRoom>) {
    this.store.setState(store => {
      Object.assign(store.room, room);
    });
  }

  ignoreMessageTypes(msgTypes: string[], replace = false) {
    if (replace) {
      this.ignoredMessageTypes = msgTypes;
    } else {
      for (const msgType of msgTypes) {
        if (!this.ignoredMessageTypes.includes(msgType)) {
          this.ignoredMessageTypes.push(msgType);
        }
      }
    }
  }

  addTestPeerAndSpeaker(peer: HMSPeer) {
    const randomURL = this.randomFromArray(this.videoURLs);
    const videoTrackID = String(this.videoURLs.indexOf(randomURL) || this.counter++);
    const audioTrackID = String(this.counter++);
    this.dummyTrackURLs[videoTrackID] = randomURL;
    peer.audioTrack = audioTrackID;
    peer.videoTrack = videoTrackID;
    this.store.setState(store => {
      if (peer.isLocal) {
        store.room.localPeer = peer.id;
      }
      store.peers[peer.id] = peer;
      store.room.peers.push(peer.id);
      store.speakers[audioTrackID] = {
        audioLevel: this.randomFromArray([0, 10, 20, 50, 70, 80, 100]),
        peerID: peer.id,
        trackID: audioTrackID,
      };
      if (peer.audioTrack) {
        store.tracks[audioTrackID] = {
          enabled: this.randomFromArray([true, false]),
          id: audioTrackID,
          type: 'audio',
          source: 'regular',
        };
      }
      if (peer.videoTrack) {
        store.tracks[videoTrackID] = {
          enabled: true,
          id: videoTrackID,
          type: 'video',
          source: 'regular',
        };
      }
    });
  }

  addTestVideoURLs(urls: string[]) {
    this.videoURLs = urls;
  }

  getRandomPeer(): HMSPeer {
    return this.randomFromArray(this.getPeers());
  }

  getPeers(): HMSPeer[] {
    return Object.values(this.store.getState().peers);
  }

  setRoles(roles: Record<string, HMSRole>) {
    this.store.setState(store => {
      store.roles = roles;
    });
  }

  private log(...args: any[]) {
    console.log('storybook sdk', ...args);
  }

  private randomNumber() {
    return Number(Math.floor(Math.random() * 100000));
  }

  private randomFromArray<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async setAudioSettings(_settings: HMSAudioTrackSettings): Promise<void> {}

  async setVideoSettings(_settings: HMSVideoTrackSettings): Promise<void> {}
}
