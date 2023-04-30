import { selectDominantSpeaker } from "@100mslive/hms-video-store";

class PeersSorter {
  listeners = new Set();
  storeUnsubscribe;
  constructor(store) {
    this.store = store;
    this.peers = [];
    this.lruPeers = new Set();
    this.speaker = undefined;
  }

  setPeersAndTilesPerPage = ({ peers, tilesPerPage }) => {
    this.tilesPerPage = tilesPerPage;
    this.lruPeers.clear();
    this.peers = [...peers];
    for (let i = 0; i < tilesPerPage; i++) {
      this.lruPeers.add(peers[i]);
    }
    if (!this.storeUnsubscribe) {
      this.storeUnsubscribe = this.store.subscribe(
        this.onDominantSpeakerChange,
        selectDominantSpeaker
      );
    }
    this.moveSpeakerToFront(this.speaker);
  };

  onUpdate = cb => {
    this.listeners.add(cb);
  };

  stop = () => {
    this.updateListeners();
    this.listeners.clear();
    this.storeUnsubscribe?.();
  };

  moveSpeakerToFront = speaker => {
    if (!speaker) {
      this.updateListeners();
      return;
    }
    const speakerPeer = this.peers.find(peer => peer.id === speaker.id);
    if (!speakerPeer) {
      this.updateListeners();
      return;
    }
    if (
      this.lruPeers.has(speakerPeer) &&
      this.lruPeers.size <= this.tilesPerPage
    ) {
      return;
    }
    const lruPeerArray = Array.from(this.lruPeers);
    while (lruPeerArray.length >= this.tilesPerPage) {
      lruPeerArray.pop();
    }
    this.lruPeers = new Set([speakerPeer, ...lruPeerArray]);
    this.peers = [
      ...lruPeerArray,
      ...this.peers.filter(peer => !this.lruPeers.has(peer)),
    ];
    this.updateListeners();
  };

  onDominantSpeakerChange = speaker => {
    if (speaker && speaker.id !== this?.speaker?.id) {
      this.speaker = speaker;
      this.moveSpeakerToFront(speaker);
    }
  };

  updateListeners = () => {
    this.listeners.forEach(listener => listener?.(this.peers));
  };
}

export default PeersSorter;
