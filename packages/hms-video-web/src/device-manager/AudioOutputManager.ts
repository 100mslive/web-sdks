import { DeviceManager } from '.';
import { AudioSinkManager } from '../audio-sink-manager';

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

  async setDevice(deviceId?: string) {
    const outputDevice = await this.deviceManager.updateOutputDevice(deviceId);
    if (outputDevice) {
      this.audioSinkManager.setOutputDevice(outputDevice.deviceId);
    }
    return outputDevice;
  }

  async unblockAutoplay() {
    await this.audioSinkManager.unblockAutoplay();
  }
}
