import { selectDominantSpeaker } from "@100mslive/hms-video-store";
class PeersSorter {
  //marker for sorting the array objects, will be last dominant speaker as well as after a certain time the toggle will become time passed and seconds spoke in that time passed,
  //for that we are creating a map between different peers and the time they spoke a true LRU cache

  constructor(store, onPeersChange) {
    this.LRUView = new Map();
    this.store = store;
    this.timePassedSinceLastSetPeers = 0;
    this.onPeersChange = onPeersChange;

    this.started = false;
    this.speaker = undefined;
  }
  setPeersAndTilesPerPage({ peers, tilesPerPage }) {
    this.tilesPerPage = tilesPerPage;
    this.start();

    this.moveSpeakerToFront(tilesPerPage, this.speaker);
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
    this.onPeersChange([...Array.from(this.peers.values())]);
  }
  // you are given a 2d array u need to sort them in a way that the dominant speaker is always in the first page
  // tilesPerpage is 2d array of pages with every page being array of peers
  //speaker is recent dominant speaker
  moveSpeakerToFront(tilesPerPage, speaker) {
    if (!speaker || !tilesPerPage) {
      this.onPeersChange(tilesPerPage);
      return;
    }
    const page0 = tilesPerPage[0];
    // you have to check if the speaker is in the zero page then return else move it to the first page
    const isSpeakerInPage0 = page0.find(peer => peer.id === speaker.id);
    if (isSpeakerInPage0) {
      this.onPeersChange(tilesPerPage);
      return;
    }
    // if the speaker is not in the first page then we need to move it to the first page
    // we need to find the page where the speaker is present
    let pageIndex = -1;
    let peerIndex = -1;
    for (let i = 0; i < tilesPerPage.length; i++) {
      const page = tilesPerPage[i];
      for (let j = 0; j < page.length; j++) {
        const peer = page[j];
        if (peer.id === speaker.id) {
          pageIndex = i;
          peerIndex = j;
          break;
        }
      }
      if (pageIndex !== -1) break;
    }
    // if the speaker is not present in any page then return
    if (pageIndex === -1) {
      this.onPeersChange(tilesPerPage);
      return;
    }
    //move the speaker to the first page first index
    //move peer on first page last index to the page where the speaker was present
    const page = tilesPerPage[pageIndex];
    const peer = page[peerIndex];
    tilesPerPage[0].unshift(peer);
    tilesPerPage[pageIndex].splice(peerIndex, 1);
    tilesPerPage[pageIndex].push(page0.pop());

    this.onPeersChange([...tilesPerPage]);
  }
  onDominantSpeakerChange(speaker) {
    if (speaker && speaker.id !== this?.lastSpokenPeer?.id) {
      this.lastSpokenPeer = speaker;
      this.moveSpeakerToFront(this.tilesPerPage, speaker);
    }
  }
}

export default PeersSorter;
