import { HMSTrackType } from './HMSTrackType';
import { stringifyMediaStreamTrack } from '../../utils/json';
import HMSLogger from '../../utils/logger';
import { HMSMediaStream, HMSRemoteStream } from '../streams';

export type HMSTrackSource = 'regular' | 'screen' | 'plugin' | 'audioplaylist' | 'videoplaylist' | string;

export class RtcTrack {
  readonly track: MediaStreamTrack;
  readonly transceiver: RTCRtpTransceiver;
  readonly stream: HMSRemoteStream;

  assignedBizTrackId: string | undefined;

  constructor(track: MediaStreamTrack, transceiver: RTCRtpTransceiver, remote: HMSRemoteStream) {
    this.track = track;
    this.transceiver = transceiver;
    this.stream = remote;
  }

  public get id(): string {
    return this.track.id;
  }
}

export abstract class HMSTrack {
  /**
   * @internal
   */
  readonly stream: HMSMediaStream;
  source?: HMSTrackSource;
  peerId?: string;
  transceiver?: RTCRtpTransceiver;
  private bizTrackId!: string;

  /**
   * @internal to print as a helpful identifier alongside logs
   */
  logIdentifier = '';

  /** The native mediastream track, for local, this changes on mute/unmute(for video),
   * and on device change.
   * @internal */
  nativeTrack: MediaStreamTrack;

  /**
   * Firefox doesn't respect the track id as sent from the backend when calling peerconnection.ontrack callback. This
   * breaks correlation of future track updates from backend. So we're storing the sdp track id as present in the
   * original offer along with the track as well and will let this override the native track id for any correlation
   * purpose.
   * This applies for remote tracks only.
   * @internal */
  private sdpTrackId?: string;

  /**
   * @internal
   * The local track id is changed on mute/unmute or when device id changes, this is abstracted as an internal
   * detail of HMSTrack and the variable is used for this enacapsulation where the first track id is remembered
   * and treated as the fixed track id for this HMSTrack. This simplifies things for the user of the sdk who
   * do not have to worry about changing track IDs.
   * This applies for local tracks only.
   */
  private firstTrackId?: string;

  abstract readonly type: HMSTrackType;

  public get enabled(): boolean {
    return this.nativeTrack.enabled;
  }

  setTrackId(trackId: string) {
    this.bizTrackId = trackId;
  }

  /**
   * firstTrackId => encapsulates change in local track ids
   * sdpTrackId => fixes remote track updates correlation on firefox
   */
  public get trackId(): string {
    return this.firstTrackId || this.sdpTrackId || this.bizTrackId;
  }

  getMediaTrackSettings(): MediaTrackSettings {
    return this.nativeTrack.getSettings();
  }

  /** setEnabled is internal to 100ms and directly impacts the
   * state of underlying 'native' track and should be equal to
   * actual remote publisher's local video track mute status.
   */
  async setEnabled(value: boolean): Promise<void> {
    this.nativeTrack.enabled = value;
  }

  protected constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: HMSTrackSource) {
    this.stream = stream;
    this.nativeTrack = track;
    this.source = source;
  }

  /**
   * @internal
   */
  setSdpTrackId(sdpTrackId: string) {
    this.sdpTrackId = sdpTrackId;
  }

  /**
   * @internal
   */
  protected setFirstTrackId(trackId: string) {
    this.firstTrackId = trackId;
  }

  /**
   * @internal
   * take care of -
   * 1. https://bugs.chromium.org/p/chromium/issues/detail?id=1232649
   * 2. stopping any tracks
   * 3. plugins related cleanups and stopping
   */
  cleanup() {
    HMSLogger.d('[HMSTrack]', 'Stopping track', this.toString());
    this.nativeTrack?.stop();
  }

  toString() {
    return `{
      streamId: ${this.stream.id};
      peerId: ${this.peerId};
      trackId: ${this.trackId};
      mid: ${this.transceiver?.mid || '-'};
      logIdentifier: ${this.logIdentifier};
      source: ${this.source};
      enabled: ${this.enabled};
      nativeTrack: ${stringifyMediaStreamTrack(this.nativeTrack)};
    }`;
  }
}
