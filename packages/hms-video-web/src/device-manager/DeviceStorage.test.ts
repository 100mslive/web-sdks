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
});
