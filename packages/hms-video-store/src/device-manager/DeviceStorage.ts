import { DeviceMap, SelectedDevices } from '../interfaces';
import { LocalStorage } from '../utils/local-storage';
import HMSLogger from '../utils/logger';

type DeviceInfo = { deviceId?: string; groupId?: string };
/**
 * This class is to manage storing and retrieving selected devices
 * from localstorage
 * @internal
 */
class DeviceStorage {
  private storage = new LocalStorage<SelectedDevices>('hms-device-selection');
  private remember = false;
  private devices?: DeviceMap;
  private readonly TAG = '[HMSDeviceStorage]';

  setDevices(devices: DeviceMap) {
    this.devices = devices;
  }

  rememberDevices(value: boolean) {
    this.remember = value;
  }

  /**
   * This will update the passed in type value in storage
   * @param {string} type - One of audioInput | videoInput | audioOutput
   * @param {DeviceInfo} param
   * @returns {void}
   */
  updateSelection(type: 'audioInput' | 'videoInput' | 'audioOutput', { deviceId, groupId }: DeviceInfo) {
    if (!this.devices || !this.remember) {
      return;
    }
    const newSelection = this.devices[type].find(device => this.isSame({ deviceId, groupId }, device));
    if (!newSelection) {
      HMSLogger.w(this.TAG, `Could not find device with deviceId: ${deviceId}, groupId: ${groupId}`);
      return;
    }
    const selectedDevices = this.storage.get() || {};
    if (type === 'audioOutput') {
      selectedDevices[type] = newSelection as MediaDeviceInfo;
    } else {
      selectedDevices[type] = newSelection as MediaDeviceInfo;
    }
    this.storage.set(selectedDevices);
  }

  getSelection() {
    if (!this.remember) {
      return undefined;
    }
    return this.storage.get();
  }

  cleanup() {
    this.remember = false;
    this.devices = undefined;
  }

  private isSame(current: DeviceInfo, device: DeviceInfo) {
    // Safari doesn't give groupId from nativeTrack. Check if groupId's match or current groupId is not present
    return current.deviceId === device.deviceId && (current.groupId === device.groupId || !current.groupId);
  }
}

export const DeviceStorageManager = new DeviceStorage();
