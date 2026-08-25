import {
  HMSHLS,
  HMSRecording,
  HMSRoom,
  HMSRTMP,
  HMSTranscriptionInfo,
  HMSTranscriptionMode,
} from '../../interfaces/room';

export default class Room implements HMSRoom {
  id: string;
  joinedAt?: Date | undefined;
  templateId?: string | undefined;
  sessionId?: string;
  startedAt?: Date;
  recording: HMSRecording = { server: { running: false }, browser: { running: false }, hls: { running: false } };
  rtmp: HMSRTMP = { running: false };
  hls: HMSHLS = { running: false, variants: [] };
  name?: string;
  peerCount?: number;
  description?: string;
  max_size?: number;
  large_room_optimization?: boolean;
  transcriptions?: HMSTranscriptionInfo[] = [];
  isEffectsEnabled?: boolean;
  disableNoneLayerRequest?: boolean;
  isVBEnabled?: boolean;
  effectsKey?: string;
  isHipaaEnabled?: boolean;
  /**
   * Raw `noiseCancellation` feature flag from /init. Written only by HMSTransport
   * on every connect, including reconnects. Never AND it here — see the derived
   * getter below.
   */
  isNoiseCancellationEnabledFromInit = false;
  /**
   * The template policy's `noiseCancellation.enabled`. Written only by Store when
   * policy arrives. Absent policy key means not configured, which means false.
   */
  isNoiseCancellationEnabledFromPolicy = false;
  translationConfig?: Record<HMSTranscriptionMode, { enabled: boolean; roleLanguages?: Record<string, string> }>;

  /**
   * Noise cancellation is available only when the account's feature flag and the
   * template policy both allow it. Derived, never stored, so that a reconnect
   * re-writing the init flag cannot clobber the template's decision.
   */
  get isNoiseCancellationEnabled(): boolean {
    return this.isNoiseCancellationEnabledFromInit && this.isNoiseCancellationEnabledFromPolicy;
  }

  constructor(id: string) {
    this.id = id;
  }
}
