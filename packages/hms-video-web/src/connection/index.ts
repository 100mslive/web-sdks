import { HMSConnectionRole } from './model';
import { ISignal } from '../signal/ISignal';
import HMSLogger from '../utils/logger';
import HMSTrack from '../media/tracks/HMSTrack';

const TAG = 'HMSConnection';
export default abstract class HMSConnection {
  readonly role: HMSConnectionRole;
  protected readonly signal: ISignal;

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
  readonly candidates = new Array<RTCIceCandidateInit>();

  protected constructor(role: HMSConnectionRole, signal: ISignal) {
    this.role = role;
    this.signal = signal;
  }

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit): RTCRtpTransceiver {
    return this.nativeConnection.addTransceiver(track, init);
  }

  async createOffer(options: RTCOfferOptions | undefined = undefined): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.nativeConnection.createOffer(options);
      HMSLogger.d(TAG, `[role=${this.role}] createOffer offer=${JSON.stringify(offer, null, 1)}`);
      return offer;
    } catch (e) {
      throw e;
    }
  }

  async createAnswer(options: RTCOfferOptions | undefined = undefined): Promise<RTCSessionDescriptionInit> {
    const answer = await this.nativeConnection.createAnswer(options);
    HMSLogger.d(TAG, `[role=${this.role}] createAnswer answer=${JSON.stringify(answer, null, 1)}`);
    return answer;
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    HMSLogger.d(TAG, `[role=${this.role}] setLocalDescription description=${JSON.stringify(description, null, 1)}`);
    await this.nativeConnection.setLocalDescription(description);
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setRemoteDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setRemoteDescription(description);
    } catch (e) {
      throw e;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    HMSLogger.d(TAG, `[role=${this.role}] addIceCandidate candidate=${JSON.stringify(candidate, null, 1)}`);
    await this.nativeConnection.addIceCandidate(candidate);
  }

  public get remoteDescription(): RTCSessionDescription | null {
    return this.nativeConnection.remoteDescription;
  }

  getSenders(): Array<RTCRtpSender> {
    return this.nativeConnection.getSenders();
  }

  removeTrack(sender: RTCRtpSender) {
    this.nativeConnection.removeTrack(sender);
  }

  async setMaxBitrate(maxBitrate: number, track: HMSTrack) {
    const sender = this.getSenders().find((s) => s?.track?.id === track.trackId);

    if (sender) {
      const params = sender.getParameters();
      params.encodings[0].maxBitrate = maxBitrate * 1000;
      await sender.setParameters(params);
    }
  }

  async close() {
    this.nativeConnection.close();
  }
}
