import { selectDominantSpeaker } from "@100mslive/hms-video-store";
class PeersSorter {
  //marker for sorting the array objects, will be last dominant speaker as well as after a certain time the toggle will become time passed and seconds spoke in that time passed,
  //for that we are creating a map between different peers and the time they spoke a true LRU cache

  constructor(store, onPeersChange) {
    this.LRUView = new Map();
    this.store = store;
    this.timePassedSinceLastSetPeers = 0;
    this.onPeersChange = onPeersChange;
    this.peers = [];
    this.started = false;
  }

  setPeersAndTilesPerPage(peers, tilesPerPage) {
    this.tilesPerPage = tilesPerPage;
    this.peers = peers;
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
    console.log("moving speaker to front ");
    let sortedPeers = this.peers;
    if (this.lastSpokenPeer) {
      const dominantPeerIndex = this.peers.findIndex(
        peer => peer.id === this.lastSpokenPeer.id
      );
      if (dominantPeerIndex !== -1) {
        const dominantPeer = this.peers[dominantPeerIndex];
        this.peers.splice(dominantPeerIndex, 1);
        sortedPeers = [dominantPeer].concat(this.peers);
      }
    }
    this.onPeersChange(sortedPeers);
    console.log("moving speaker to front 2", sortedPeers);
  }

  onDominantSpeakerChange(speaker) {
    if (speaker && speaker.id !== this?.lastSpokenPeer?.id) {
      this.lastSpokenPeer = speaker;
      this.moveSpeakerToFront();
    }
  }
}

export default PeersSorter;
