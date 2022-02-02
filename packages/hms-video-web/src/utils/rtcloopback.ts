class Loopback {
  rtcConnection = new RTCPeerConnection();
  rtcLoopbackConnection = new RTCPeerConnection();
  audioContext = new AudioContext();
  offerOptions = {
    offerVideo: true,
    offerAudio: true,
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  };
  constructor() {
    this.rtcConnection.onicecandidate = e => {
      e.candidate && this.rtcLoopbackConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
    this.rtcLoopbackConnection.onicecandidate = e => {
      e.candidate && this.rtcConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
  }

  async processAudioFromUrl(url: string) {
    const track = await this.createAudioTrackFromUrl(url);
    return new Promise<MediaStreamTrack>(resolve => {
      this.rtcConnection.addTrack(track);
      this.rtcLoopbackConnection.ontrack = e => {
        resolve(e.track);
      };
      this.setOfferAnswer();
    });
  }

  async processAudioFromTrack(track: MediaStreamTrack) {
    return new Promise<MediaStreamTrack>(resolve => {
      this.rtcConnection.addTrack(track);
      this.rtcLoopbackConnection.ontrack = e => {
        resolve(e.track);
      };
      this.setOfferAnswer();
    });
  }

  private async createAudioTrackFromUrl(url: string): Promise<MediaStreamTrack> {
    const BlobURL = await fetch(url);

    const buffer = await BlobURL.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(buffer);
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const streamDestination = this.audioContext.createMediaStreamDestination();

    source.connect(streamDestination);
    source.start();
    return streamDestination.stream.getAudioTracks()[0];
  }

  private async setOfferAnswer() {
    const offer: RTCSessionDescriptionInit = await this.rtcConnection.createOffer(this.offerOptions);
    await this.rtcConnection.setLocalDescription(offer);
    await this.rtcLoopbackConnection.setRemoteDescription(offer);

    const answer: RTCSessionDescriptionInit = await this.rtcLoopbackConnection.createAnswer();
    await this.rtcLoopbackConnection.setLocalDescription(answer);
    await this.rtcConnection.setRemoteDescription(answer);
  }
}

export const RTCLoopback = (() => {
  let loopback: Loopback | null = null;

  return {
    getInstance: function () {
      if (!loopback) {
        loopback = new Loopback();
      }
      return loopback;
    },
  };
})();
