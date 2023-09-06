import { useCallback } from 'react';
import {
  DeviceType,
  selectDevices,
  selectIsAllowedToPreviewMedia,
  selectIsAllowedToPublish,
  selectIsInPreview,
  selectLocalMediaSettings,
} from '@100mslive/hms-video-store';
import { hooksErrHandler } from '../hooks/types';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

export type DeviceTypeAndInfo<T> = {
  [key in DeviceType]?: T;
};

export interface useDevicesResult {
  /**
   * list of all devices by type
   */
  allDevices: DeviceTypeAndInfo<MediaDeviceInfo[]>;
  /**
   * selected device ids for all types
   */
  selectedDeviceIDs: DeviceTypeAndInfo<string>;
  /**
   * function to call to update device
   */
  updateDevice: ({ deviceType, deviceId }: { deviceType: DeviceType; deviceId: string }) => Promise<void>;
}

/**
 * This hook can be used to implement a UI component which allows the user to manually change their
 * audio/video device. It returns the list of all devices as well as the currently selected one. The input
 * devices will be returned based on what the user is allowed to publish, so a audio only user won't get
 * the audioInput field. This can be used to show the UI dropdowns properly.
 *
 * Note:
 * - Browsers give access to the list of devices only if the user has given permission to access them
 * - Changing devices manually work best in combination with remembering the user's selection for the next time, do
 *   pass the rememberDeviceSelection flag at time of join for this to happen.
 *
 * @param handleError error handler for any errors during device change
 */
export const useDevices = (handleError: hooksErrHandler = logErrorHandler): useDevicesResult => {
  const actions = useHMSActions();
  const sdkAllDevices: DeviceTypeAndInfo<MediaDeviceInfo[]> = useHMSStore(selectDevices);
  const sdkSelectedDevices = useHMSStore(selectLocalMediaSettings);
  const isInPreview = useHMSStore(selectIsInPreview);
  const selectAllowed = isInPreview ? selectIsAllowedToPreviewMedia : selectIsAllowedToPublish;
  const isAllowedToPublish = useHMSStore(selectAllowed);

  const selectedDeviceIDs: DeviceTypeAndInfo<string> = {
    [DeviceType.audioOutput]: sdkSelectedDevices.audioOutputDeviceId,
  };
  const allDevices: DeviceTypeAndInfo<MediaDeviceInfo[]> = {
    [DeviceType.audioOutput]: sdkAllDevices.audioOutput,
  };

  if (isAllowedToPublish.video) {
    allDevices[DeviceType.videoInput] = sdkAllDevices.videoInput;
    selectedDeviceIDs[DeviceType.videoInput] = sdkSelectedDevices.videoInputDeviceId;
  }
  if (isAllowedToPublish.audio) {
    allDevices[DeviceType.audioInput] = sdkAllDevices.audioInput;
    selectedDeviceIDs[DeviceType.audioInput] = sdkSelectedDevices.audioInputDeviceId;
  }

  const updateDevice = useCallback(
    async ({ deviceType, deviceId }: { deviceType: DeviceType; deviceId: string }) => {
      try {
        switch (deviceType) {
          case DeviceType.audioInput:
            await actions.setAudioSettings({ deviceId });
            break;
          case DeviceType.videoInput:
            await actions.setVideoSettings({ deviceId });
            break;
          case DeviceType.audioOutput:
            await actions.setAudioOutputDevice(deviceId);
            break;
        }
      } catch (err) {
        handleError(err as Error, 'updateDevices');
      }
    },
    [handleError, actions],
  );

  return {
    allDevices,
    selectedDeviceIDs,
    updateDevice,
  };
};
