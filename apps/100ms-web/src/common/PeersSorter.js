import { selectDominantSpeaker } from "@100mslive/hms-video-store";
class PeersSorter {
  //marker for sorting the array objects, will be last dominant speaker as well as after a certain time the toggle will become time passed and seconds spoke in that time passed,
  //for that we are creating a map between different peers and the time they spoke a true LRU cache

  constructor(store, onPeersChange) {
    this.store = store;
    this.timePassedSinceLastSetPeers = 0;
    this.onPeersChange = onPeersChange;
    this.peers = [];
    this.lruPeers = new Set();

    this.started = false;
    this.speaker = undefined;
  }
  setPeersAndTilesPerPage({ peers, tilesPerPage }) {
    this.tilesPerPage = tilesPerPage;
    this.peers = [...peers];
    for (let i = 0; i < tilesPerPage; i++) {
      this.lruPeers.add(peers[i]);
    }
    this.start();
    this.moveSpeakerToFront(this.speaker);
  }
  start() {
    if (this.started) return;
    this.started = true;
    this.store.subscribe(
      this.onDominantSpeakerChange.bind(this),
      selectDominantSpeaker
    );
  }

  stop() {
    if (!this.started) return;
    this.started = false;
    this.store.unsubscribe(
      this.onDominantSpeakerChange.bind(this),
      selectDominantSpeaker
    );
    this.onPeersChange([...this.peers]);
  }
  // you are given a 2d array u need to sort them in a way that the dominant speaker is always in the first page
  // tilesPerpage is 2d array of pages with every page being array of peers
  //speaker is recent dominant speaker
  moveSpeakerToFront(speaker) {
    if (!speaker) {
      this.onPeersChange(this.peers);
      return;
    }
    const speakerPeer = this.peers.find(peer => peer.id === speaker.id);
    if (
      this.lruPeers.has(speakerPeer) &&
      this.lruPeers.size <= this.tilesPerPage
    ) {
      console.log("already exists");
      return;
    }
    const array = Array.from(this.lruPeers);
    while (array.length >= this.tilesPerPage) {
      array.pop();
    }
    array.unshift(speakerPeer);
    this.lruPeers = new Set(array);
    this.onPeersChange([
      ...array,
      ...this.peers.filter(peer => !this.lruPeers.has(peer)),
    ]);
  }

  onDominantSpeakerChange(speaker) {
    if (speaker && speaker.id !== this?.lastSpokenPeer?.id) {
      this.lastSpokenPeer = speaker;
      this.moveSpeakerToFront(speaker);
    }
  }
}

export default PeersSorter;
