import {
  selectIsConnectedToRoom,
  selectPeers,
} from "@100mslive/hms-video-store";

class RemoteAudioLevels {
  constructor() {
    this.audioContext = new AudioContext();
    this.intervalMs = 100;
    this.shouldMonitor = false;
    this.hasStarted = false;
    this.unsubs = [];
    this.analysers = {};
  }

  setStoreActions(store, actions) {
    this.store = store;
    this.actions = actions;
  }

  async start() {
    if (this.hasStarted) {
      return;
    }
    this.hasStarted = true;
    console.log("starting audio level monitor for remote peers");
    const unsub = this.store.subscribe(
      this.monitorAudioLevels.bind(this),
      selectIsConnectedToRoom
    );
    this.unsubs.push(unsub);
  }

  async stop() {
    if (!this.hasStarted) {
      return;
    }
    this.hasStarted = false;
    this.shouldMonitor = false;
    this.unsubs.forEach(unsub => unsub());
    console.log("stopped audio level monitor for remote peers");
  }

  async monitorAudioLevels() {
    const isConnected = this.store.getState(selectIsConnectedToRoom);
    if (!isConnected) {
      console.log(
        "room no longer connected, stopping audio level monitoring for remote"
      );
      this.shouldMonitor = false;
      return;
    }
    if (this.shouldMonitor) {
      return;
    }
    console.log("monitoring audio levels");
    this.shouldMonitor = true;
    const loop = () => {
      if (this.shouldMonitor) {
        this.logAllPeersAudioLevels();
        setTimeout(loop, this.intervalMs);
      } else {
        console.log("stopped monitoring audio levels");
      }
    };
    setTimeout(loop, 1000);
  }

  async logAllPeersAudioLevels() {
    if (!window.__triggerBeamEvent__) {
      return;
    }
    // optimise this to selectTracks instead of selecting peers
    const allPeers = this.store.getState(selectPeers);
    const peers = allPeers.filter(peer => !!peer.audioTrack);
    const peerAudioLevels = [];
    for (const peer of peers) {
      const sdkTrack = this.actions.hmsSDKTracks[peer.audioTrack];
      const nativeStream = sdkTrack?.stream?.nativeStream;
      if (nativeStream) {
        const peerLevel = await this.getAudioLevel(peer, nativeStream);
        if (peerLevel.level > 0) {
          peerAudioLevels.push(peerLevel);
        }
      }
    }
    if (peerAudioLevels.length > 0) {
      const payload = {
        event: "app-audio-level",
        data: peerAudioLevels,
      };
      console.log("logging audio levels", peerAudioLevels);
      window.__triggerBeamEvent__(JSON.stringify(payload));
    }
  }

  async getAudioLevel(peer, stream) {
    // take audio stream from getusermedia
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

  createAnalyserNode(stream) {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    return analyser;
  }

  calculateAudioLevel(analyserNode) {
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

export const remoteAudioLevels = new RemoteAudioLevels();
