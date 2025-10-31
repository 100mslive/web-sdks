import { DeviceManager } from './DeviceManager';
import {
  DevicesWiredHeadphonesWithMic,
  DevicesWiredHeadphonesWithoutMic,
  DevicesWithStereoHeadphones,
} from './DeviceTestData';
import { EventBus } from '../events/EventBus';
import { Store } from '../sdk/store';

describe('DeviceManager', () => {
  const store = new Store();
  const eventBus = new EventBus();
  const deviceManager = new DeviceManager(store, eventBus);
  deviceManager.audioInput = DevicesWiredHeadphonesWithoutMic.audioInput;
  deviceManager.audioOutput = DevicesWiredHeadphonesWithoutMic.audioOutput;
  deviceManager.videoInput = DevicesWiredHeadphonesWithoutMic.videoInput;

  it('should select non default input on device change', () => {
    const selectedAudioInput = deviceManager.getNewAudioInputDevice();
    expect(selectedAudioInput?.deviceId).toBe(deviceManager.audioInput[1].deviceId);
  });

  it('should select default output device when headphones with no mic connected', () => {
    deviceManager.setOutputDevice();
    // Should select MacBook Pro Speakers since it has matching groupId with the selected input device
    const expectedDevice = deviceManager.audioOutput.find(
      device => device.groupId === deviceManager.audioInput[1].groupId && device.deviceId !== 'default',
    );
    expect(deviceManager.outputDevice?.deviceId).toBe(expectedDevice?.deviceId);
  });

  it('should select default output when headphones with mic is connected', () => {
    // Store the previous device id before changing devices
    const previousDeviceId = deviceManager.outputDevice?.deviceId;

    deviceManager.audioInput = DevicesWiredHeadphonesWithMic.audioInput;
    deviceManager.audioOutput = DevicesWiredHeadphonesWithMic.audioOutput;
    expect(deviceManager.getNewAudioInputDevice()?.deviceId).toBe(deviceManager.audioInput[1].deviceId);
    deviceManager.setOutputDevice();

    // When no matching groupId is found, should keep the previous device if it still exists
    // The previous device should still exist in the new audioOutput list
    const previousDevice = deviceManager.audioOutput.find(device => device.deviceId === previousDeviceId);
    expect(deviceManager.outputDevice?.deviceId).toBe(previousDevice?.deviceId);
  });

  it('should select no default output device when headphones with stereo is connected', () => {
    deviceManager.audioInput = DevicesWithStereoHeadphones.audioInput;
    deviceManager.audioOutput = DevicesWithStereoHeadphones.audioOutput;
    deviceManager.setOutputDevice();
    expect(deviceManager.outputDevice?.deviceId).toBe(deviceManager.audioOutput[3].deviceId);
  });
});
