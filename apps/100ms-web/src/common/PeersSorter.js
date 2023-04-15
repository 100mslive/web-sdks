import { selectDominantSpeaker } from "@100mslive/hms-video-store";
class PeersSorter {
  //marker for sorting the array objects, will be last dominant speaker as well as after a certain time the toggle will become time passed and seconds spoke in that time passed,
  //for that we are creating a map between different peers and the time they spoke a true LRU cache

  constructor(store, onPeersChange) {
    this.LRUView = new Map();
    this.store = store;
    this.timePassedSinceLastSetPeers = 0;
    this.onPeersChange = onPeersChange;
    this.peers = new Map();
    this.started = false;
  }
  setPeersAndTilesPerPage(peers, tilesPerPage) {
    peers.forEach(peer => {
      this.peers.set(peer.id, peer);
    });
    this.tilesPerPage = tilesPerPage;
    this.start();
    this.moveSpeakerToFront();
  }
  start() {
    if (this.started) return;
    this.started = true;
    this.store.subscribe(
      this.onDominantSpeakerChange.bind(this),
      selectDominantSpeaker
    );
  }

  moveSpeakerToFront() {
    let sortedPeers = Array.from(this.peers.values());
    console.log(this.lastSpokenPeer);
    if (this.lastSpokenPeer) {
      const dominantPeer = this.peers.get(this.lastSpokenPeer.id);

      if (dominantPeer?.id) {
        const sortedPeersMap = new Map();
        sortedPeersMap.set(dominantPeer.id, dominantPeer);
        this.peers = new Map([...sortedPeersMap, ...this.peers]);
        sortedPeers = [...Array.from(this.peers.values())];
      }
    }
    this.onPeersChange(sortedPeers);
  }

  onDominantSpeakerChange(speaker) {
    if (speaker && speaker.id !== this?.lastSpokenPeer?.id) {
      this.lastSpokenPeer = speaker;
      this.moveSpeakerToFront();
    }
  }
}

export default PeersSorter;
