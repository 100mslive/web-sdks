import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSLogger from '../../utils/logger';
import { isFirefox } from '../../utils/support';
import { HMSMediaStream, HMSRemoteStream } from '../streams';

export class HMSAudioTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.AUDIO;
  private audioElement: HTMLAudioElement | null = null;
  private outputDevice?: MediaDeviceInfo;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'audio') {
      throw new Error("Expected 'track' kind = 'audio'");
    }
  }

  getVolume() {
    return this.audioElement ? this.audioElement.volume * 100 : null;
  }

  async setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    // Don't subscribe to audio when volume is 0
    await this.subscribeToAudio(value === 0 ? false : this.enabled);
    if (this.audioElement) {
      this.audioElement.volume = value / 100;
    }
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
    try {
      // @ts-ignore
      if (typeof this.audioElement.setSinkId === 'function') {
        if (isFirefox) {
          // using setSinkId in firefox disables echo cancellation (introduced in Firefox 116)
          // todo: GoogleMeet doesn't set sinkId for all 3 audio elements, how do they redirect audio then?
          //
          // refer: https://100ms.atlassian.net/browse/LIVE-1992
          // refer: https://bugzilla.mozilla.org/show_bug.cgi?id=1849108
          // refer: https://bugzilla.mozilla.org/show_bug.cgi?id=1848283
          // refer: https://github.com/aws/amazon-chime-sdk-js/issues/2742
        } else {
          // @ts-ignore
          await this.audioElement?.setSinkId(device.deviceId);
        }

        this.outputDevice = device;
      }
    } catch (error) {
      HMSLogger.d('[HMSAudioTrack]', 'error in setSinkId', error);
    }
  }

  protected async subscribeToAudio(value: boolean) {
    if (this.stream instanceof HMSRemoteStream) {
      await this.stream.setAudio(value, this.trackId, this.logIdentifier);
    }
  }
}
