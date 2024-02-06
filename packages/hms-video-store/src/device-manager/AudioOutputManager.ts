import { DeviceManager } from './DeviceManager';
import { AudioSinkManager } from '../audio-sink-manager';
import { HMSAudioContextHandler } from '../utils/media';

export interface IAudioOutputManager {
  getDevice(): MediaDeviceInfo | undefined;
  setDevice(deviceId: string): Promise<MediaDeviceInfo | undefined>;
  getVolume(): number;
  setVolume(value: number): void;
}

export class AudioOutputManager implements IAudioOutputManager {
  constructor(private deviceManager: DeviceManager, private audioSinkManager: AudioSinkManager) {}

  getVolume() {
    return this.audioSinkManager.getVolume();
  }

  setVolume(value: number) {
    if (value < 0 || value > 100) {
      throw Error('Please pass a valid number between 0-100');
    }
    this.audioSinkManager.setVolume(value);
  }

  getDevice() {
    return this.deviceManager.outputDevice;
  }

  setDevice(deviceId?: string) {
    return this.deviceManager.updateOutputDevice(deviceId, true);
  }

  async unblockAutoplay() {
    await this.audioSinkManager.unblockAutoplay();
    /**
     * similar to autoplay error when there's no user interaction,
     * audio context is paused due to which empty audio tracks do not send any data and therefore it doesn't reach SFU.
     * resume audio context on user interaction to enable empty audio tracks to send data and be forwarded to remote peers
     */
    await HMSAudioContextHandler.resumeContext();
  }
}
