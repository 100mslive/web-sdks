import { HMSTrack, HMSTrackSource } from './HMSTrack';
import { HMSTrackType } from './HMSTrackType';
import HMSLogger from '../../utils/logger';
import HMSMediaStream from '../streams/HMSMediaStream';
import HMSRemoteStream from '../streams/HMSRemoteStream';

export class HMSAudioTrack extends HMSTrack {
  readonly type: HMSTrackType = HMSTrackType.AUDIO;
  private audioElement: HTMLAudioElement | null = null;
  private outputDevice?: MediaDeviceInfo;
  private volume = 1;
  private audioCtx: AudioContext | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;

  constructor(stream: HMSMediaStream, track: MediaStreamTrack, source?: string) {
    super(stream, track, source as HMSTrackSource);
    this.audioCtx = new AudioContext();
    if (track.kind !== 'audio') {
      throw new Error("Expected 'track' kind = 'audio'");
    }
  }

  getVolume() {
    console.log('getVolume::volume:: ', this.audioElement?.volume, this.gainNode?.gain?.value);
    return this.gainNode ? this.gainNode.gain.value * 100 : null;
  }

  async setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    // Don't subscribe to audio when volume is 0
    // await this.subscribeToAudio(value === 0 ? false : this.enabled);
    if (this.audioElement && this.gainNode) {
      // this.audioElement.volume = value / 100;
      this.gainNode.gain.value = value / 100;
      this.volume = value / 100;
    }
    console.log('setVolume::volume:: ', this.audioElement?.volume, this.gainNode?.gain?.value);
  }
  setAudioElement(element: HTMLAudioElement | null) {
    HMSLogger.d('[HMSAudioTrack]', this.logIdentifier, 'adding audio element', `${this}`, element);
    this.audioElement = element;
    if (!this.audioElement || !this.audioCtx) {
      return;
    }

    // Create a MediaElementAudioSourceNode
    // Feed the HTMLMediaElement into it
    this.audioSource = this.audioCtx.createMediaElementSource(this.audioElement);
    // Create a gain node
    this.gainNode = this.audioCtx.createGain();

    this.audioSource.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
    // this.audioElement.volume = this.volume;
    // this.gainNode.gain.value = this.volume;
    console.log('setAudioElement::volume::', this.audioElement?.volume, this.gainNode.gain.value, this.volume);
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
        // @ts-ignore
        await this.audioElement?.setSinkId(device.deviceId);
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
