import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSLogger from '../../utils/logger';
import { isChromiumBased, parsedUserAgent } from '../../utils/support';
import { HMSMediaStream, HMSRemoteStream } from '../streams';

export class HMSAudioTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.AUDIO;
  private audioElement: HTMLAudioElement | null = null;
  private outputDevice?: MediaDeviceInfo;
  /**
   * Last volume asked for, kept off the audio element so it survives the element being torn down
   * and rebuilt. Undefined until something asks for one, which is how a track that was never given
   * its own volume is told apart from one deliberately set to the same value as the sink's.
   */
  private requestedVolume?: number;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'audio') {
      throw new Error("Expected 'track' kind = 'audio'");
    }
  }

  getVolume() {
    // floor is required because of floating-point precision. e.g 0.55*100 gives 55.00000000000001
    if (this.audioElement) {
      return Math.floor(this.audioElement.volume * 100);
    }
    // the element is rebuilt on decode-error recovery; reporting null there records volume 0 in the
    // store for a peer that is not muted, which drops the app's slider to zero
    return this.requestedVolume ?? null;
  }

  /** what was asked for on this track specifically, or undefined if it only ever took the sink's */
  getRequestedVolume() {
    return this.requestedVolume;
  }

  async setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    this.requestedVolume = value;
    // Local and immediate. Ordering this after the await left the element at the old volume for
    // however long the SFU took to answer, and forever when it never did - and the subscribe call
    // can now throw, which skipped it entirely.
    if (this.audioElement) {
      this.audioElement.volume = value / 100;
    }
    // Don't subscribe to audio when volume is 0
    await this.subscribeToAudio(value === 0 ? false : this.enabled);
  }

  /**
   * setVolume(0) silences the peer by unsubscribing, so anything that resubscribes has to check
   * this first or it hands back audio the user asked not to hear.
   */
  protected isSilenced() {
    return this.requestedVolume === 0;
  }

  setAudioElement(element: HTMLAudioElement | null) {
    HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'adding audio element', `${this}`, element);
    this.audioElement = element;
  }

  /**
   * @internal
   * @returns {HTMLAudioElement | null}
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  getOutputDevice() {
    return this.outputDevice;
  }

  cleanup() {
    super.cleanup();
    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement.remove();
      this.audioElement = null;
    }
  }

  async setOutputDevice(device?: MediaDeviceInfo) {
    if (!device) {
      HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'device is null', `${this}`);
      return;
    }
    if (!this.audioElement) {
      HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'no audio element to set output', `${this}`);
      this.outputDevice = device;
      return;
    }
    // using setSinkId in firefox disables echo cancellation (introduced in Firefox 116)
    // todo: GoogleMeet doesn't set sinkId for all 3 audio elements, how do they redirect audio then?
    //
    // refer: https://100ms.atlassian.net/browse/LIVE-1992
    // refer: https://bugzilla.mozilla.org/show_bug.cgi?id=1849108
    // refer: https://bugzilla.mozilla.org/show_bug.cgi?id=1848283
    // refer: https://github.com/aws/amazon-chime-sdk-js/issues/2742
    // Setting sinkId in safari(support started from 18.4) causes "robotic voice" on bluetooth device changes or setting sinkId
    const hasSetSinkId = typeof (this.audioElement as any).setSinkId === 'function';
    if (!hasSetSinkId || !isChromiumBased) {
      this.logSetSinkIdSkipped(device, hasSetSinkId);
      return;
    }
    try {
      await (this.audioElement as any).setSinkId(device.deviceId);
      this.outputDevice = device;
      HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'setSinkId succeeded', device.label, `${this}`);
    } catch (error) {
      // setSinkId rejects (NotFoundError / NotAllowedError / AbortError). Don't silently
      // swallow — the caller needs to know the UI says "device X selected" but audio
      // is still routing to the previous sink. See LIV-254.
      HMSLogger.w('[HMSAudioTrack]', this.logIdentifier, 'setSinkId failed', `${this}`, error);
      throw error;
    }
  }

  private logSetSinkIdSkipped(device: MediaDeviceInfo, hasSetSinkId: boolean) {
    const reason = hasSetSinkId ? 'non-chromium-browser' : 'setSinkId-unsupported';
    const browser = parsedUserAgent.getBrowser();
    HMSLogger.d(
      '[HMSAudioTrack]',
      this.logIdentifier,
      'setSinkId skipped, audio stays on the OS default sink',
      `{
        reason: ${reason};
        browser: ${browser?.name};
        browserVersion: ${browser?.version};
        requestedDevice: ${device.label};
      }`,
      `${this}`,
    );
  }

  protected async subscribeToAudio(value: boolean) {
    if (this.stream instanceof HMSRemoteStream) {
      await this.stream.setAudio(value, this.trackId, this.logIdentifier);
    }
  }
}
