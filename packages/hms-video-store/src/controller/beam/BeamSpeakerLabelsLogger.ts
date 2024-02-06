import { HMSGenericTypes, HMSPeer, IHMSStore, selectIsConnectedToRoom, selectPeers } from '../../';
import { HMSLogger } from '../../common/ui-logger';
import { IHMSActions } from '../../IHMSActions';

/**
 * Log data of audio level and speaker speaking periodically to beam for transcript
 * diarization.
 */
export class BeamSpeakerLabelsLogger<T extends HMSGenericTypes> {
  private audioContext?: AudioContext;
  private readonly intervalMs: number;
  private shouldMonitor: boolean;
  private hasStarted: boolean;
  private unsubs: any[];
  private readonly analysers: Record<string, AnalyserNode>;
  private readonly store: IHMSStore<T>;
  private actions: IHMSActions<T>;
  constructor(store: IHMSStore<T>, actions: IHMSActions<T>) {
    this.intervalMs = 100;
    this.shouldMonitor = false;
    this.hasStarted = false;
    this.unsubs = [];
    this.analysers = {};
    this.store = store;
    this.actions = actions;
  }

  async start() {
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;
    HMSLogger.d('starting audio level monitor for remote peers', this.store);
    const isConnected = this.store.getState(selectIsConnectedToRoom);
    HMSLogger.d('starting audio levels is connected to room', isConnected);
    if (isConnected) {
      await this.monitorAudioLevels();
    }
    const unsub = this.store.subscribe(this.monitorAudioLevels.bind(this), selectIsConnectedToRoom);
    this.unsubs.push(unsub);
  }

  async stop() {
    if (!this.hasStarted) {
      return;
    }
    this.hasStarted = false;
    this.shouldMonitor = false;
    this.unsubs.forEach(unsub => unsub());
    HMSLogger.d('stopped audio level monitor for remote peers');
  }

  async monitorAudioLevels() {
    const isConnected = this.store.getState(selectIsConnectedToRoom);
    if (!isConnected) {
      if (this.shouldMonitor) {
        HMSLogger.i('room no longer connected, stopping audio level monitoring for remote');
        this.shouldMonitor = false;
      }
      return;
    }
    if (this.shouldMonitor) {
      return;
    }
    HMSLogger.i('monitoring audio levels');
    this.shouldMonitor = true;
    const loop = () => {
      if (this.shouldMonitor) {
        this.logAllPeersAudioLevels();
        setTimeout(loop, this.intervalMs);
      } else {
        HMSLogger.i('stopped monitoring audio levels');
      }
    };
    setTimeout(loop, 1000);
  }

  // eslint-disable-next-line complexity
  async logAllPeersAudioLevels() {
    if (!window.__triggerBeamEvent__) {
      return;
    }
    // optimise this to selectTracks instead of selecting peers
    const allPeers = this.store.getState(selectPeers);
    const peers = allPeers.filter(peer => !!peer.audioTrack);
    const peerAudioLevels = [];
    for (const peer of peers) {
      const sdkTrack = this.actions.getTrackById(peer.audioTrack || '');
      const nativeStream: MediaStream | undefined = sdkTrack?.stream?.nativeStream;
      if (!peer.joinedAt) {
        continue;
      }
      if (nativeStream) {
        const peerLevel = await this.getAudioLevel(peer, nativeStream);
        if (peerLevel.level > 0) {
          peerAudioLevels.push(peerLevel);
        }
      }
    }
    if (peerAudioLevels.length > 0) {
      const payload = {
        event: 'app-audio-level',
        data: peerAudioLevels,
      };
      HMSLogger.d('logging audio levels', peerAudioLevels);
      window.__triggerBeamEvent__(JSON.stringify(payload));
    }
  }

  async getAudioLevel(peer: HMSPeer, stream: MediaStream) {
    if (!this.analysers[stream.id]) {
      this.analysers[stream.id] = this.createAnalyserNode(stream);
    }
    const analyserNode = this.analysers[stream.id];
    const level = this.calculateAudioLevel(analyserNode);
    return {
      peerId: peer.id,
      peerName: peer.name,
      level,
    };
  }

  createAnalyserNode(stream: MediaStream) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    const analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    return analyser;
  }

  calculateAudioLevel(analyserNode: AnalyserNode) {
    const data = new Uint8Array(analyserNode.fftSize);
    analyserNode.getByteTimeDomainData(data);
    const lowest = 0.009;
    let max = lowest;
    for (const frequency of data) {
      max = Math.max(max, (frequency - 128) / 128);
    }
    const normalized = (Math.log(lowest) - Math.log(max)) / Math.log(lowest);
    const percent = Math.ceil(Math.min(Math.max(normalized * 100, 0), 100));
    return percent;
  }
}
