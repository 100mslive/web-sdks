import { HMSPeer, HMSPeerID, IStoreReadOnly, selectDominantSpeaker } from '@100mslive/react-sdk';

class PeersSorter {
  storeUnsubscribe: undefined | (() => void) = undefined;
  store: IStoreReadOnly<any>;
  peers: Map<string, HMSPeer>;
  lruPeers: Set<HMSPeerID>;
  tilesPerPage!: number;
  listeners: Set<(peers: HMSPeer[]) => void>;
  lastSpeakerMoveTime = 0;
  speakerMoveDebounceMs = 500; // Minimum time between position updates

  constructor(store: IStoreReadOnly<any>) {
    this.store = store;
    this.peers = new Map();
    this.lruPeers = new Set();
    this.listeners = new Set();
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
      // Add new peers to the LRU set if there's room
      if (this.lruPeers.size < tilesPerPage) {
        this.lruPeers.add(peer.id);
      }
    });

    if (!this.storeUnsubscribe) {
      this.storeUnsubscribe = this.store.subscribe(this.onDominantSpeakerChange, selectDominantSpeaker);
    }

    // Simply update listeners without trying to move any speaker
    this.maintainLruSize(this.tilesPerPage);
    this.updateListeners();
  };

  onUpdate = (cb: (peers: HMSPeer[]) => void) => {
    this.listeners.add(cb);
  };

  stop = () => {
    this.updateListeners();
    this.listeners.clear();
    this.storeUnsubscribe?.();
    this.storeUnsubscribe = undefined;
  };

  moveSpeakerToFront = (speaker: HMSPeer) => {
    // If not enough time has passed since the last update, don't reposition
    if (Date.now() - this.lastSpeakerMoveTime < this.speakerMoveDebounceMs) {
      return;
    }

    // If speaker is already visible, don't reposition
    if (this.lruPeers.has(speaker.id) && this.lruPeers.size <= this.tilesPerPage) {
      return;
    }

    // delete to insert at beginning
    this.lruPeers.delete(speaker.id);
    // - 1 as we are going to insert the new speaker
    this.maintainLruSize(this.tilesPerPage - 1);
    this.lruPeers = new Set([speaker.id, ...this.lruPeers]);

    this.lastSpeakerMoveTime = Date.now();
    this.updateListeners();
  };

  onDominantSpeakerChange = (speaker: HMSPeer | null) => {
    // no speaker - do nothing
    if (!speaker) {
      return;
    }
    // if the active speaker is not from the peers passed ignore
    if (!this.peers.has(speaker.id)) {
      return;
    }

    this.moveSpeakerToFront(speaker);
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

  private maintainLruSize = (size: number) => {
    const lruPeerArray = Array.from(this.lruPeers);
    while (lruPeerArray.length > size && lruPeerArray.length) {
      lruPeerArray.pop();
    }
    this.lruPeers = new Set(lruPeerArray);
  };
}

export default PeersSorter;
