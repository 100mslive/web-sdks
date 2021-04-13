import {HMSConnectionRole} from "./model";
import {ISignal} from "../signal/ISignal";

export default abstract class HMSConnection {
  readonly role: HMSConnectionRole;
  readonly signal: ISignal;

  abstract readonly nativeConnection: RTCPeerConnection;
  /**
   * We keep a list of pending IceCandidates received
   * from the signalling server. When the peer-connection
   * is initialized we call [addIceCandidate] for each.
   *
   * WARN:
   *  - [HMSPublishConnection] keeps the complete list of candidates (for
   *      ice-connection failed/disconnect) forever.
   *  - [HMSSubscribeConnection] clears this list as soon as we call [addIceCandidate]
   */
  readonly candidates = new Array<RTCIceCandidateInit>()

  constructor(role: HMSConnectionRole, signal: ISignal) {
    this.role = role;
    this.signal = signal;
  }

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit): RTCRtpTransceiver {
    return this.nativeConnection.addTransceiver(track, init);
  }

  async createOffer(options: RTCOfferOptions | undefined = undefined): Promise<RTCSessionDescriptionInit> {
    return await this.nativeConnection.createOffer(options)
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.nativeConnection.setLocalDescription(description)
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.nativeConnection.setRemoteDescription(description)
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.nativeConnection.addIceCandidate(candidate)
  }

  async close() {
    this.nativeConnection.close();
  }
}