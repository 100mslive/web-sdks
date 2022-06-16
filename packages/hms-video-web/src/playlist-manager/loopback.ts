/**
 * This class is used to create two peer connections which are connected to each other. This can be useful in two cases:
 * 1. To get a playlist audio track whose audio is not considered as audio of the peer.audiotrack
 * 2. To get a CanvasCaptureMediaStreamTrack as a MediaStreamTrack as the former does not work in safari
 *
 * Working:
 * Two Peer connections are created.
 * Whenever a track is to be processed, it is added to the first connection and offer/answer is updated on both peer connections.
 * On the second peer connection on track, the processed track is received, which is then returned. This track is then published to
 * 100ms SFU.
 */
export class Loopback {
  private rtcConnection: RTCPeerConnection;
  private rtcLoopbackConnection: RTCPeerConnection;
  private audioContext: AudioContext;
  offerOptions = {
    offerVideo: true,
    offerAudio: true,
    offerToReceiveAudio: false,
    offerToReceiveVideo: false,
  };
  constructor() {
    this.rtcConnection = new RTCPeerConnection();
    this.rtcLoopbackConnection = new RTCPeerConnection();
    this.audioContext = new AudioContext();
    this.rtcConnection.onicecandidate = e => {
      e.candidate && this.rtcLoopbackConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
    this.rtcLoopbackConnection.onicecandidate = e => {
      e.candidate && this.rtcConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
    };
  }

  cleanup() {
    this.rtcConnection.close();
    this.rtcLoopbackConnection.close();
    this.audioContext.close();
  }

  async processAudioFromUrl(url: string): Promise<MediaStreamTrack> {
    const track = await this.createAudioTrackFromUrl(url);
    return new Promise<MediaStreamTrack>(resolve => {
      this.rtcConnection.addTrack(track);
      this.rtcLoopbackConnection.ontrack = e => {
        resolve(e.track);
      };
      this.setOfferAnswer();
    });
  }

  async processAudioFromTrack(track: MediaStreamTrack): Promise<MediaStreamTrack> {
    return new Promise<MediaStreamTrack>(resolve => {
      this.rtcConnection.addTrack(track);
      this.rtcLoopbackConnection.ontrack = e => {
        resolve(e.track);
      };
      this.setOfferAnswer();
    });
  }

  async processVideoFromTrack(track: MediaStreamTrack): Promise<MediaStreamTrack> {
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
