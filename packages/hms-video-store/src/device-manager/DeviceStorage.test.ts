import { DeviceStorageManager } from './DeviceStorage';
import { DevicesWiredHeadphonesWithoutMic } from './DeviceTestData';

describe('DeviceStorage', () => {
  DeviceStorageManager.rememberDevices(false);
  DeviceStorageManager.setDevices(DevicesWiredHeadphonesWithoutMic);
  const selection = {
    audioInput: DevicesWiredHeadphonesWithoutMic.audioInput[0],
    videoInput: DevicesWiredHeadphonesWithoutMic.videoInput[0],
    audioOutput: DevicesWiredHeadphonesWithoutMic.audioOutput[0],
  };

  it('should not update device to storage if not remembered', () => {
    DeviceStorageManager.updateSelection('audioInput', {
      deviceId: selection.audioInput.deviceId,
      groupId: selection.audioInput.groupId,
    });
    expect(DeviceStorageManager.getSelection()).toBeUndefined();
  });

  it('should update audioInput device to storage if remembered', () => {
    DeviceStorageManager.rememberDevices(true);
    DeviceStorageManager.updateSelection('audioInput', {
      deviceId: selection.audioInput.deviceId,
      groupId: selection.audioInput.groupId,
    });
    expect(DeviceStorageManager.getSelection()?.audioInput).toEqual(selection.audioInput);
  });

  it('should update audioOutputdevice to storage and see if prev update exists', () => {
    DeviceStorageManager.updateSelection('audioOutput', {
      deviceId: selection.audioOutput.deviceId,
      groupId: selection.audioOutput.groupId,
    });
    expect(DeviceStorageManager.getSelection()?.audioInput).toEqual(selection.audioInput);
    expect(DeviceStorageManager.getSelection()?.audioOutput).toEqual(selection.audioOutput);
  });

  it('should remove stored devices that are no longer present when setDevices is called', () => {
    // Setup: ensure remember is true and we have stored devices
    DeviceStorageManager.rememberDevices(true);
    DeviceStorageManager.setDevices(DevicesWiredHeadphonesWithoutMic);

    // Store all three device types
    DeviceStorageManager.updateSelection('audioInput', {
      deviceId: selection.audioInput.deviceId,
      groupId: selection.audioInput.groupId,
    });
    DeviceStorageManager.updateSelection('videoInput', {
      deviceId: selection.videoInput.deviceId,
      groupId: selection.videoInput.groupId,
    });
    DeviceStorageManager.updateSelection('audioOutput', {
      deviceId: selection.audioOutput.deviceId,
      groupId: selection.audioOutput.groupId,
    });

    // Verify all devices are stored
    const storedBefore = DeviceStorageManager.getSelection();
    expect(storedBefore?.audioInput).toEqual(selection.audioInput);
    expect(storedBefore?.videoInput).toEqual(selection.videoInput);
    expect(storedBefore?.audioOutput).toEqual(selection.audioOutput);

    // Create new device list without the stored devices (simulating unplugged devices)
    const devicesWithMissingItems = {
      audioInput: [
        {
          deviceId: 'new-audio-input',
          kind: 'audioinput',
          label: 'New Audio Input',
          groupId: 'new-group-1',
        } as MediaDeviceInfo,
      ],
      videoInput: [], // No video devices available
      audioOutput: DevicesWiredHeadphonesWithoutMic.audioOutput, // Keep original audio outputs
    };

    // Call setDevices with the new list
    DeviceStorageManager.setDevices(devicesWithMissingItems);

    // Check that removed devices are cleared from storage
    const storedAfter = DeviceStorageManager.getSelection();
    expect(storedAfter?.audioInput).toBeUndefined(); // Should be removed as device is no longer present
    expect(storedAfter?.videoInput).toBeUndefined(); // Should be removed as device is no longer present
    expect(storedAfter?.audioOutput).toEqual(selection.audioOutput); // Should remain as device is still present
  });

  it('should not remove devices from storage when remember is false', () => {
    // Setup: ensure remember is false
    DeviceStorageManager.rememberDevices(false);

    // First enable remember to store a device
    DeviceStorageManager.rememberDevices(true);
    DeviceStorageManager.setDevices(DevicesWiredHeadphonesWithoutMic);
    DeviceStorageManager.updateSelection('audioInput', {
      deviceId: selection.audioInput.deviceId,
      groupId: selection.audioInput.groupId,
    });

    // Verify device is stored
    expect(DeviceStorageManager.getSelection()?.audioInput).toEqual(selection.audioInput);

    // Now disable remember and call setDevices with empty list
    DeviceStorageManager.rememberDevices(false);
    DeviceStorageManager.setDevices({ audioInput: [], videoInput: [], audioOutput: [] });

    // Re-enable remember to check storage
    DeviceStorageManager.rememberDevices(true);

    // Device should still be in storage as cleanup was skipped when remember was false
    expect(DeviceStorageManager.getSelection()?.audioInput).toEqual(selection.audioInput);
  });
});
