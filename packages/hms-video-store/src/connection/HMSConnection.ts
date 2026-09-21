import IConnectionObserver, { RTCIceCandidatePair } from './IConnectionObserver';
import { HMSConnectionRole } from './model';
import { ErrorFactory } from '../error/ErrorFactory';
import { HMSAction } from '../error/HMSAction';
import { HMSAudioTrackSettings, HMSVideoTrackSettings } from '../media/settings';
import { HMSLocalTrack, HMSLocalVideoTrack } from '../media/tracks';
import { TrackState } from '../notification-manager';
import JsonRpcSignal from '../signal/jsonrpc';
import HMSLogger from '../utils/logger';
import { enableOpusDtx, fixMsid } from '../utils/session-description';

const TAG = '[HMSConnection]';

export default abstract class HMSConnection {
  readonly role: HMSConnectionRole;
  protected readonly signal: JsonRpcSignal;

  protected abstract readonly observer: IConnectionObserver;
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
  // @ts-ignore
  sfuNodeId?: string;

  selectedCandidatePair?: RTCIceCandidatePair;

  /** Monotonic id of the most recently requested local description (bumped on entry, not on apply). */
  private localDescriptionEpoch = 0;

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

  public get signalingState(): RTCSignalingState {
    return this.nativeConnection.signalingState;
  }

  private get action() {
    return this.role === HMSConnectionRole.Publish ? HMSAction.PUBLISH : HMSAction.SUBSCRIBE;
  }

  setSfuNodeId(nodeId?: string) {
    this.sfuNodeId = nodeId;
  }

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit): RTCRtpTransceiver {
    return this.nativeConnection.addTransceiver(track, init);
  }

  /** True when the transceiver is still attached to this connection. */
  hasTransceiver(transceiver?: RTCRtpTransceiver): boolean {
    return !!transceiver && this.nativeConnection.getTransceivers().includes(transceiver);
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

  /** True while `epoch` is still the newest local description staged on this connection. */
  isStagingLocalDescription(epoch: number): boolean {
    return this.localDescriptionEpoch === epoch;
  }

  /**
   * Returns the epoch of the offer just staged. Bumped on entry, before the native call is
   * chained onto the operations queue, so a racer is visible from the moment it starts.
   */
  async setLocalDescription(description: RTCSessionDescriptionInit): Promise<number> {
    const epoch = ++this.localDescriptionEpoch;
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setLocalDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setLocalDescription(description);
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.SetLocalDescriptionFailed(this.action, (error as Error).message);
    }
    return epoch;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      HMSLogger.d(TAG, `[role=${this.role}] setRemoteDescription description=${JSON.stringify(description, null, 1)}`);
      await this.nativeConnection.setRemoteDescription(description);
    } catch (error) {
      throw ErrorFactory.WebrtcErrors.SetRemoteDescriptionFailed(this.action, (error as Error).message);
    }
  }

  /**
   * Applies the answer, then flushes the candidates onTrickle buffered before any remote
   * description. Gated on this being the first answer; after it onTrickle adds directly.
   */
  async setRemoteDescriptionAndDrainCandidates(description: RTCSessionDescriptionInit): Promise<void> {
    const drain = !this.remoteDescription;
    await this.setRemoteDescription(description);
    if (!drain) {
      return;
    }
    for (const candidate of this.candidates) {
      // the description is already applied, so one unparseable candidate must not skip the rest
      // nor report the negotiation as failed — the caller would undo a publish that did happen
      try {
        await this.addIceCandidate(candidate);
      } catch (error) {
        HMSLogger.w(TAG, `[role=${this.role}] buffered candidate rejected`, candidate, error);
      }
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

  handleSelectedIceCandidatePairs() {
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

          const handleSelectedCandidate = () => {
            // @ts-expect-error
            if (typeof iceTransport.getSelectedCandidatePair === 'function') {
              // @ts-expect-error
              this.selectedCandidatePair = iceTransport.getSelectedCandidatePair();
              if (this.selectedCandidatePair) {
                this.observer.onSelectedCandidatePairChange(this.selectedCandidatePair);
                HMSLogger.d(
                  TAG,
                  `${HMSConnectionRole[this.role]} connection`,
                  `selected ${kindOfTrack || 'unknown'} candidate pair`,
                  JSON.stringify(this.selectedCandidatePair, null, 2),
                );
              }
            }
          };

          // @ts-expect-error
          if (typeof iceTransport.onselectedcandidatepairchange === 'function') {
            // @ts-expect-error
            iceTransport.onselectedcandidatepairchange = handleSelectedCandidate;
          }
          handleSelectedCandidate();
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

  // eslint-disable-next-line
  async setMaxBitrateAndFramerate(
    track: HMSLocalTrack,
    updatedSettings?: HMSAudioTrackSettings | HMSVideoTrackSettings,
  ) {
    const maxBitrate = updatedSettings?.maxBitrate || track.settings.maxBitrate;
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

  close() {
    this.nativeConnection.close();
  }

  private getReceivers() {
    return this.nativeConnection.getReceivers();
  }
}
