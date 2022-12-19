class PeersSorter {
  //marker for sorting the array objects, will be last dominant speaker as well as after a certain time the toggle will become time passed and seconds spoke in that time passed,
  //for that we are creating a map between different peers and the time they spoke a true LRU cache

  constructor(tilesPerPage, threshold) {
    this.tilesPerPage = tilesPerPage;
    this.LRUView = new Map();
    this.lastSpokenPeer = "";
    this.threshold = threshold;
    this.timePassedSinceLastSetPeers = 0;
  }

  setTilesPerPage(tilesPerPage) {
    this.tilesPerPage = tilesPerPage;
  }
  //to be called on initiation of the PeersSorter
  setPeersAndActiveSpeakers(peers, speaker, timePassed) {
    const tempPeerObj = { timeSpoken: 0, timeActive: 0 };
    const timePassedAfterLastSet = setInterval(() => {
      timePassed += 1;
    }, 1000);
    if (!this.LRUView.size) {
      peers.slice(0, this.tilesPerPage).forEach(peer => {
        this.LRUView.set(peer.id, tempPeerObj);
      });
    } else if (this.LRUView.size < this.tilesPerPage) {
      let diff = this.LRUView.size - this.tilesPerPage;
      peers.forEach(peer => {
        if (diff === 0) {
          return;
        }
        if (!this.LRUView.has(peer.id)) {
          this.LRUView.set(peer.id, tempPeerObj);
          diff -= diff;
        }
      });
    } else {
      if (timePassed >= this.threshold) {
        const lastPeer = this.getLastPeerAfterThreshold();
        this.LRUView.delete(lastPeer.id);
        const newPeer = peers.find(peer => speaker.id === peer.id);
        this.LRUView.set(newPeer.id, tempPeerObj);
      } else {
        const lastPeer = this.getLastPeerBeforeThreshold();
        this.LRUView.delete(lastPeer.id);
        const newPeer = peers.find(peer => speaker.id === peer.id);
        this.LRUView.set(newPeer.id, tempPeerObj);
      }
      clearInterval(timePassedAfterLastSet);
    }
  }

  //will inherently have precendence i.e. aforementioned above. will return main view peers and side view peers
  getSortedPeers(peers, speaker) {
    let sortedArray = [];
    if (this.timePassedSinceLastSetPeers > this.threshold) {
      sortedArray = Array.from(this.LRUView.entries()).sort((a, b) => {
        return !(b.timeActive - a.timeActive ? 1 : b.timeSpoken - a.timeSpoken);
      });
    } else {
      sortedArray = Array.from(this.LRUView.entries()).sort((a, b) => {
        return !(b.timeSpoken - a.timeSpoken ? 1 : b.timeActive - a.timeActive);
      });
    }
    let mainView = sortedArray.slice(0, this.tilesPerPage);
    let sideView = sortedArray.slice(this.tilesPerPage);
    return {
      mainView,
      sideView,
    };
  }

  //function to increment active time on LRU View
  incrementPeersTime(peers) {}

  //function to increment time spoken on LRU view by a peer
  incrementPeerSpokenTime(peer, marker) {
    const incrementPeerSpokenTime = setInterval(() => {}, 1000);
    if (marker !== this.lastSpokenPeer) {
      clearInterval(incrementPeerSpokenTime);
    }
  }

  //function to get least valued peer after the threshold has passed
  getLastPeerAfterThreshold() {
    return Array.from(this.LRUView.entries()).sort((a, b) => {
      return !(b.timeSpoken - a.timeSpoken ? 1 : b.timeActive - a.timeActive);
    })[0];
  }

  //function to get least valued peer after the threshold has not passed
  getLastPeerBeforeThreshold() {
    return Array.from(this.LRUView.entries()).sort((a, b) => {
      return !(b.timeActive - a.timeActive ? 1 : b.timeSpoken - a.timeSpoken);
    })[0];
  }
}

export default PeersSorter;
