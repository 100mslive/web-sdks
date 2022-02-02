const rtcConnection = new RTCPeerConnection();
const rtcLoopbackConnection = new RTCPeerConnection();
const audioContext = new AudioContext();
const offerOptions = {
  offerVideo: true,
  offerAudio: true,
  offerToReceiveAudio: false,
  offerToReceiveVideo: false,
};
export class RTCLoopback {
  constructor(
    private listener: {
      onTrackAdd: (track: MediaStreamTrack) => Promise<void>;
    },
  ) {}

  async processAudioFromUrl(url: string) {
    const track = await this.createAudioTrackFromUrl(url);
    rtcConnection.addTrack(track);
    await this.setOfferAnswer();
  }

  async processAudioFromTrack(track: MediaStreamTrack) {
    rtcConnection.addTrack(track);
    await this.setOfferAnswer();
  }

  private async createAudioTrackFromUrl(url: string): Promise<MediaStreamTrack> {
    const BlobURL = await fetch(url);

    const buffer = await BlobURL.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;

    const streamDestination = audioContext.createMediaStreamDestination();

    source.connect(streamDestination);
    source.start();
    return streamDestination.stream.getAudioTracks()[0];
  }

  private async setOfferAnswer() {
    rtcConnection.onicecandidate = e => {
      e.candidate && rtcLoopbackConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
    rtcLoopbackConnection.onicecandidate = e => {
      e.candidate && rtcConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
    rtcLoopbackConnection.ontrack = e => {
      this.listener.onTrackAdd(e.track);
      const audio = new Audio();
      audio.srcObject = new MediaStream([e.track]);
      audio.play();
    };
    const offer: RTCSessionDescriptionInit = await rtcConnection.createOffer(offerOptions);
    await rtcConnection.setLocalDescription(offer);

    await rtcLoopbackConnection.setRemoteDescription(offer);
    const answer: RTCSessionDescriptionInit = await rtcLoopbackConnection.createAnswer();
    await rtcLoopbackConnection.setLocalDescription(answer);

    await rtcConnection.setRemoteDescription(answer);
  }
}
