import { HMSPeer, HMSPeerID, IStoreReadOnly, selectDominantSpeaker } from '@100mslive/react-sdk';

class PeersSorter {
  storeUnsubscribe: undefined | (() => void) = undefined;
  store: IStoreReadOnly<any>;
  peers: Map<string, HMSPeer>;
  lruPeers: Set<HMSPeerID>;
  tilesPerPage!: number;
  speaker?: HMSPeer;
  listeners: Set<(peers: HMSPeer[]) => void> = new Set();

  constructor(store: IStoreReadOnly<any>) {
    this.store = store;
    this.peers = new Map();
    this.lruPeers = new Set();
    this.speaker = undefined;
  }

  setPeersAndTilesPerPage = ({ peers, tilesPerPage }: { peers: HMSPeer[]; tilesPerPage: number }) => {
    this.tilesPerPage = tilesPerPage;
    const peerIds = new Set(peers.map(peer => peer.id));
    // remove existing peers which are no longer provided
    this.peers.forEach((_, key) => {
      if (!peerIds.has(key)) {
        this.peers.delete(key);
      }
    });
    this.lruPeers = new Set([...this.lruPeers].filter(peerId => peerIds.has(peerId)));
    peers.forEach(peer => {
      this.peers.set(peer.id, peer);
      if (this.lruPeers.size < tilesPerPage) {
        this.lruPeers.add(peer.id);
      }
    });
    if (!this.storeUnsubscribe) {
      this.storeUnsubscribe = this.store.subscribe(this.onDominantSpeakerChange, selectDominantSpeaker);
    }
    this.moveSpeakerToFront(this.speaker);
  };

  onUpdate = (cb: (peers: HMSPeer[]) => void) => {
    this.listeners.add(cb);
  };

  stop = () => {
    this.updateListeners();
    this.listeners.clear();
    this.storeUnsubscribe?.();
  };

  moveSpeakerToFront = (speaker?: HMSPeer) => {
    if (!speaker) {
      this.updateListeners();
      return;
    }
    if (this.lruPeers.has(speaker.id) && this.lruPeers.size <= this.tilesPerPage) {
      this.updateListeners();
      return;
    }
    // delete to insert at beginning
    this.lruPeers.delete(speaker.id);
    const lruPeerArray = Array.from(this.lruPeers);
    while (lruPeerArray.length >= this.tilesPerPage && lruPeerArray.length) {
      lruPeerArray.pop();
    }
    this.lruPeers = new Set([speaker.id, ...lruPeerArray]);
    this.updateListeners();
  };

  onDominantSpeakerChange = (speaker: HMSPeer | null) => {
    if (speaker && speaker.id !== this?.speaker?.id) {
      this.speaker = speaker;
      this.moveSpeakerToFront(speaker);
    }
  };

  updateListeners = () => {
    const orderedPeers: HMSPeer[] = [];
    this.lruPeers.forEach(key => {
      const peer = this.peers.get(key);
      if (peer) {
        orderedPeers.push(peer);
      }
    });
    this.peers.forEach(peer => {
      if (!this.lruPeers.has(peer.id) && peer) {
        orderedPeers.push(peer);
      }
    });
    this.listeners.forEach(listener => listener?.(orderedPeers));
  };
}

export default PeersSorter;
