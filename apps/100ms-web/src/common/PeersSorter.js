import { selectDominantSpeaker } from "@100mslive/hms-video-store";

class PeersSorter {
  listeners = new Set();
  storeUnsubscribe;

  constructor(store) {
    this.store = store;
    this.peers = new Map();
    this.lruPeers = new Set();
    this.speaker = undefined;
  }

  setPeersAndTilesPerPage = ({ peers, tilesPerPage }) => {
    this.tilesPerPage = tilesPerPage;
    this.lruPeers.clear();
    peers.forEach(peer => {
      this.peers.set(peer.id, peer);
      if (this.lruPeers.size < tilesPerPage) {
        this.lruPeers.add(peer);
      }
    });
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
    const speakerPeer = this.peers.get(speaker.id);
    if (!speakerPeer) {
      return;
    }
    if (
      this.lruPeers.has(speakerPeer) &&
      this.lruPeers.size <= this.tilesPerPage
    ) {
      return;
    }

    // delete to insert at beginning
    this.lruPeers.delete(speakerPeer);
    let lruPeerArray = Array.from(this.lruPeers);
    while (lruPeerArray.length >= this.tilesPerPage) {
      lruPeerArray.pop();
    }
    this.lruPeers = new Set([speakerPeer, ...lruPeerArray]);
    this.updateListeners();
  };

  onDominantSpeakerChange = speaker => {
    if (speaker && speaker.id !== this?.speaker?.id) {
      this.speaker = speaker;
      this.moveSpeakerToFront(speaker);
    }
  };

  updateListeners = () => {
    const remainingPeers = [];
    this.peers.forEach(peer => {
      if (!this.lruPeers.has(peer) && peer) {
        remainingPeers.push(peer);
      }
    });
    const orderedPeers = [...this.lruPeers].concat(remainingPeers);
    this.listeners.forEach(listener => listener?.(orderedPeers));
  };
}

export default PeersSorter;
