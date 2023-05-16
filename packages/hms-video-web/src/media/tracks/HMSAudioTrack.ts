import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSLogger from '../../utils/logger';
import HMSMediaStream from '../streams/HMSMediaStream';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export class HMSAudioTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.AUDIO;
  private audioElement: HTMLAudioElement | null = null;
  private outputDevice?: MediaDeviceInfo;
  private gainNode: GainNode | null = null;
  private volume = 100;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    if (track.kind !== 'audio') {
      throw new Error("Expected 'track' kind = 'audio'");
    }
  }

  getVolume() {
    return this.gainNode ? this.volume : null;
  }

  async setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    // Don't subscribe to audio when volume is 0
    await this.subscribeToAudio(value === 0 ? false : this.enabled);
    this.volume = value;
    if (this.gainNode) {
      this.gainNode.gain.value = value / 100;
    }
  }

  setAudioElement(element: HTMLAudioElement | null) {
    HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'adding audio element', `${this}`, element);
    this.audioElement = element;
  }

  setAudioSource(source: AudioNode, gainNode: GainNode) {
    this.gainNode = gainNode;
    this.gainNode.gain.value = this.volume / 100;
    source.connect(gainNode);
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
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  protected async subscribeToAudio(value: boolean) {
    if (this.stream instanceof HMSRemoteStream) {
      await this.stream.setAudio(value, this.trackId, this.logIdentifier);
    }
  }
}
