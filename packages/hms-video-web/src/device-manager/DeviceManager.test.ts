import { Store } from '../sdk/store';
import { DeviceManager } from './DeviceManager';
import {
  DevicesWiredHeadphonesWithMic,
  DevicesWiredHeadphonesWithoutMic,
  DevicesWithStereoHeadphones,
} from './DeviceTestData';

describe('DeviceManager', () => {
  const store = new Store();
  const deviceManager = new DeviceManager(store);
  deviceManager.audioInput = DevicesWiredHeadphonesWithoutMic.audioInput;
  deviceManager.audioOutput = DevicesWiredHeadphonesWithoutMic.audioOutput;
  deviceManager.videoInput = DevicesWiredHeadphonesWithoutMic.videoInput;

  it('should select non default input on device change', () => {
    const selectedAudioInput = deviceManager.getNewAudioInputDevice();
    expect(selectedAudioInput?.deviceId).toBe(deviceManager.audioInput[1].deviceId);
  });

  it('should select default output device when headphones with no mic connected', () => {
    deviceManager.setOutputDevice();
    expect(deviceManager.outputDevice?.deviceId).toBe(deviceManager.audioOutput[0].deviceId);
  });

  it('should select default output when headphones with mic is connected', () => {
    deviceManager.audioInput = DevicesWiredHeadphonesWithMic.audioInput;
    deviceManager.audioOutput = DevicesWiredHeadphonesWithMic.audioOutput;
    expect(deviceManager.getNewAudioInputDevice()?.deviceId).toBe(deviceManager.audioInput[1].deviceId);
    deviceManager.setOutputDevice();
    expect(deviceManager.outputDevice?.deviceId).toBe(deviceManager.audioOutput[0].deviceId);
  });

  it('should select no default output device when headphones with stereo is connected', () => {
    deviceManager.audioInput = DevicesWithStereoHeadphones.audioInput;
    deviceManager.audioOutput = DevicesWithStereoHeadphones.audioOutput;
    deviceManager.setOutputDevice();
    expect(deviceManager.outputDevice?.deviceId).toBe(deviceManager.audioOutput[3].deviceId);
  });
});
