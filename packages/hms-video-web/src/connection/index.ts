import { HMSConnectionRole } from './model';
import { ISignal } from '../signal/ISignal';
import HMSLogger from '../utils/logger';
import HMSTrack from '../media/tracks/HMSTrack';
import { HMSConnectionMethod, HMSConnectionMethodException } from '../error/utils';
import { normalizeMediaId } from '../utils/media-id';
import * as sdpTransform from 'sdp-transform';

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

  public get iceConnectionState(): RTCIceConnectionState {
    return this.nativeConnection.iceConnectionState;
  }

  public get connectionState(): RTCPeerConnectionState {
    return this.nativeConnection.connectionState;
  }

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit): RTCRtpTransceiver {
    return this.nativeConnection.addTransceiver(track, init);
  }

  async createOffer(options: RTCOfferOptions | undefined = undefined, tracks: any): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.nativeConnection.createOffer(options);
      HMSLogger.d(TAG, `[role=${this.role}] createOffer offer=${JSON.stringify(offer, null, 1)}`);
      return transformOffer(offer, tracks);
    } catch (e) {
      throw new HMSConnectionMethodException(HMSConnectionMethod.CreateOffer, e.message);
    }
  }

  async createAnswer(options: RTCOfferOptions | undefined = undefined): Promise<RTCSessionDescriptionInit> {
    try {
      const answer = await this.nativeConnection.createAnswer(options);
      HMSLogger.d(TAG, `[role=${this.role}] createAnswer answer=${JSON.stringify(answer, null, 1)}`);
      return answer;
    } catch (e) {
      throw new HMSConnectionMethodException(HMSConnectionMethod.CreateAnswer, e.message);
    }
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setLocalDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setLocalDescription(description);
    } catch (e) {
      throw new HMSConnectionMethodException(HMSConnectionMethod.SetLocalDescription, e.message);
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setRemoteDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setRemoteDescription(description);
    } catch (e) {
      throw new HMSConnectionMethodException(HMSConnectionMethod.SetRemoteDescription, e.message);
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
    const sender = this.getSenders().find((s) => s?.track?.id && normalizeMediaId(s?.track?.id) === track.trackId);

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

function transformOffer(offer: any, tracks: any[]) {
  const parsedSdp = sdpTransform.parse(offer.sdp);
  if (!parsedSdp.origin?.username.startsWith('mozilla')) {
    // This isn't firefox, so we return the original offer without doing anything
    return offer;
  }

  // For each track, find the corresponding media line and replace the msid with correct track id
  tracks.forEach((track) => {
    const trackInSdp = parsedSdp.media.find((m) => m.type === track.type);
    if (trackInSdp) trackInSdp.msid = trackInSdp?.msid?.split(' ').slice(0, 1).concat(track.track_id).join(' '); // @REFACTOR: This isn't very clean and I'm not that happy with this, but this gets the work done 🤷🏻‍♂️
  });

  return { ...offer, sdp: sdpTransform.write(parsedSdp) };
}
