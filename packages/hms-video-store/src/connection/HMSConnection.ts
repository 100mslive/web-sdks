import { HMSConnectionRole } from './model';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../media/tracks';
import { TrackState } from '../notification-manager';
import JsonRpcSignal from '../signal/jsonrpc';
import HMSLogger from '../utils/logger';
import { enableOpusDtx, fixMsid } from '../utils/session-description';

const TAG = '[HMSConnection]';
interface RTCIceCandidatePair {
  local: RTCIceCandidate;
  remote: RTCIceCandidate;
}

export default abstract class HMSConnection {
  readonly role: HMSConnectionRole;
  protected readonly signal: JsonRpcSignal;

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

  selectedCandidatePair?: RTCIceCandidatePair;

  protected constructor(role: HMSConnectionRole, signal: JsonRpcSignal) {
    this.role = role;
    this.signal = signal;
  }

  public get iceConnectionState(): RTCIceConnectionState {
    return this.nativeConnection.iceConnectionState;
  }

  public get connectionState(): RTCPeerConnectionState {
    return this.nativeConnection.connectionState;
  }

  private get action() {
    return this.role === HMSConnectionRole.Publish ? HMSAction.PUBLISH : HMSAction.SUBSCRIBE;
  }

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit): RTCRtpTransceiver {
    return this.nativeConnection.addTransceiver(track, init);
  }

  async createOffer(tracks?: Map<string, TrackState>, options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.nativeConnection.createOffer(options);
      HMSLogger.d(TAG, `[role=${this.role}] createOffer offer=${JSON.stringify(offer, null, 1)}`);
      return enableOpusDtx(fixMsid(offer, tracks));
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.CreateOfferFailed(this.action, (error as Error).message);
    }
  }

  async createAnswer(options: RTCOfferOptions | undefined = undefined): Promise<RTCSessionDescriptionInit> {
    try {
      const answer = await this.nativeConnection.createAnswer(options);
      HMSLogger.d(TAG, `[role=${this.role}] createAnswer answer=${JSON.stringify(answer, null, 1)}`);
      return answer;
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.CreateAnswerFailed(this.action, (error as Error).message);
    }
  }

  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setLocalDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setLocalDescription(description);
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.SetLocalDescriptionFailed(this.action, (error as Error).message);
    }
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setRemoteDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setRemoteDescription(description);
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.SetRemoteDescriptionFailed(this.action, (error as Error).message);
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.nativeConnection.signalingState === 'closed') {
      HMSLogger.d(TAG, `[role=${this.role}] addIceCandidate signalling state closed`);
      return;
    }
    HMSLogger.d(TAG, `[role=${this.role}] addIceCandidate candidate=${JSON.stringify(candidate, null, 1)}`);
    await this.nativeConnection.addIceCandidate(candidate);
  }

  public get remoteDescription(): RTCSessionDescription | null {
    return this.nativeConnection.remoteDescription;
  }

  getSenders(): Array<RTCRtpSender> {
    return this.nativeConnection.getSenders();
  }

  logSelectedIceCandidatePairs() {
    /**
     * for the very first peer in the room we don't have any subscribe ice candidates
     * because the peer hasn't subscribed to anything.
     *
     * For all peers joining after this peer, we have published and subscribed at the time of join itself
     * so we're able to log both publish and subscribe ice candidates.
     * Added try catch for the whole section as the getSenders and getReceivers is throwing errors in load test
     */
    try {
      const transmitters = this.role === HMSConnectionRole.Publish ? this.getSenders() : this.getReceivers();

      transmitters.forEach(transmitter => {
        const kindOfTrack = transmitter.track?.kind;
        if (transmitter.transport) {
          const iceTransport = transmitter.transport.iceTransport;

          const logSelectedCandidate = () => {
            // @ts-expect-error
            if (typeof iceTransport.getSelectedCandidatePair === 'function') {
              // @ts-expect-error
              this.selectedCandidatePair = iceTransport.getSelectedCandidatePair();
              HMSLogger.d(
                TAG,
                `${HMSConnectionRole[this.role]} connection`,
                `selected ${kindOfTrack || 'unknown'} candidate pair`,
                JSON.stringify(this.selectedCandidatePair, null, 2),
              );
            }
          };

          // @ts-expect-error
          if (typeof iceTransport.onselectedcandidatepairchange === 'function') {
            // @ts-expect-error
            iceTransport.onselectedcandidatepairchange = logSelectedCandidate;
          }
          logSelectedCandidate();
        }
      });
    } catch (error) {
      HMSLogger.w(
        TAG,
        `Error in logging selected ice candidate pair for ${HMSConnectionRole[this.role]} connection`,
        error,
      );
    }
  }

  removeTrack(sender: RTCRtpSender) {
    if (this.nativeConnection.signalingState !== 'closed') {
      this.nativeConnection.removeTrack(sender);
    }
  }

  async setMaxBitrateAndFramerate(track: HMSLocalTrack) {
    const maxBitrate = track.settings.maxBitrate;
    const maxFramerate = track instanceof HMSLocalVideoTrack && track.settings.maxFramerate;
    const sender = this.getSenders().find(s => s?.track?.id === track.getTrackIDBeingSent());

    if (sender) {
      const params = sender.getParameters();
      // modify only for non-simulcast encodings
      if (params.encodings.length === 1) {
        if (maxBitrate) {
          params.encodings[0].maxBitrate = maxBitrate * 1000;
        }
        if (maxFramerate) {
          // @ts-ignore
          params.encodings[0].maxFramerate = maxFramerate;
        }
      }
      await sender.setParameters(params);
    } else {
      HMSLogger.w(
        TAG,
        `no sender found to setMaxBitrate for track - ${track.trackId}, sentTrackId - ${track.getTrackIDBeingSent()}`,
      );
    }
  }

  async getStats() {
    return await this.nativeConnection.getStats();
  }

  async close() {
    this.nativeConnection.close();
  }

  private getReceivers() {
    return this.nativeConnection.getReceivers();
  }
}
