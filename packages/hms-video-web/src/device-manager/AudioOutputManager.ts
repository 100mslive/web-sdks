import { AudioSinkManager } from '../audio-sink-manager';
import { DeviceManager } from '.';

interface IAudioOutputManager {
  getDevice(): MediaDeviceInfo | undefined;
  setDevice(deviceId: string): MediaDeviceInfo | undefined;
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
    return this.deviceManager.selected.audioOutput;
  }

  setDevice(deviceId?: string) {
    return this.deviceManager.updateOutputDevice(deviceId);
  }
}
