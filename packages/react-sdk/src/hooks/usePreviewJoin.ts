import {
  HMSRoomState,
  selectIsConnectedToRoom,
  selectRoomState,
  HMSConfigInitialSettings,
} from '@100mslive/hms-video-store';
import { useCallback, useMemo } from 'react';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';
import { HMSConfig } from '@100mslive/hms-video';

export interface usePreviewInput {
  /**
   * name of user who is joining, this is only required if join is called
   */
  name?: string;
  /**
   * app side authentication token
   */
  token: string;
  /**
   * any extra metadata info for the peer
   */
  metadata?: string;
  /**
   * function to handle errors happening during preview
   */
  handleError?: hooksErrHandler;
  initEndpoint?: string;
  /**
   * initial settings for audio/video and device to be used.
   */
  initialSettings?: HMSConfigInitialSettings;
  /**
   * Enable to get a network quality score while in preview. The score ranges from -1 to 5.
   * -1 when we are not able to connect to 100ms servers within an expected time limit
   * 0 when there is a timeout/failure when measuring the quality
   * 1-5 ranges from poor to good quality.
   */
  captureNetworkQualityInPreview?: boolean;
  /**
   * in most cases selecting devices with an actual device id is better than
   * picking the default device(deviceId = default) to make sure that
   * both audio input and output are from the same device(same earphone, laptop, etc.)
   *
   * but in some cases where audio input devices(mics) that have a headphone jack
   * come up in the list of available audio output devices as wellalthough they don't really have a speaker.
   *
   * to avoid selecting these false speaker devices, ignore input-output matching and select default device.
   *
   * use this property to provide a list of device labels for which
   * input-output matching should be ignored and default device should be selected.
   *
   * use "all" if you want to ignore input-output matching altogether and select the default device always
   */
  speakerAutoSelectionBlacklist?: 'all' | string[];
}

export interface usePreviewResult {
  /**
   * enable the join button for the user only when this is true
   */
  enableJoin: boolean;
  /**
   * call this function to join the room
   */
  join: () => Promise<void>;
  /**
   * once the user has joined the room, till leave happens this flag will be true. It can be used
   * to decide to show between preview form and conferencing component/video tiles.
   */
  isConnected: boolean;
  /**
   * call this function to join the room
   */
  preview: () => Promise<void>;
}

/**
 * This hook can be used to build a preview UI component, this lets you call preview everytime the passed in
 * token changes. This hook is best used in combination with useDevices for changing devices, useAVToggle for
 * muting/unmuting and useAudioLevelStyles for showing mic audio level to the user.
 * Any device change or mute/unmute will be carried across to join.
 */
export const usePreviewJoin = ({
  name = '',
  token,
  metadata,
  handleError = logErrorHandler,
  initEndpoint,
  initialSettings,
  captureNetworkQualityInPreview,
  speakerAutoSelectionBlacklist,
}: usePreviewInput): usePreviewResult => {
  const actions = useHMSActions();
  const roomState = useHMSStore(selectRoomState);
  const isConnected = useHMSStore(selectIsConnectedToRoom) || false;
  const enableJoin = roomState === HMSRoomState.Preview;

  const config: HMSConfig = useMemo(() => {
    return {
      userName: name,
      authToken: token,
      metaData: metadata,
      rememberDeviceSelection: true,
      settings: initialSettings,
      initEndpoint: initEndpoint,
      captureNetworkQualityInPreview,
      speakerAutoSelectionBlacklist,
    };
  }, [
    name,
    token,
    metadata,
    initEndpoint,
    initialSettings,
    captureNetworkQualityInPreview,
    speakerAutoSelectionBlacklist,
  ]);

  const preview = useCallback(async () => {
    if (!token) {
      return;
    }
    if (roomState !== HMSRoomState.Disconnected) {
      return;
    }
    if (isConnected) {
      await actions.leave();
    }
    try {
      await actions.preview(config);
    } catch (err) {
      handleError(err as Error, 'preview');
    }
  }, [actions, handleError, token, roomState, config, isConnected]);

  const join = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      await actions.join(config);
    } catch (err) {
      handleError(err as Error, 'join');
    }
  }, [actions, config, handleError, token]);

  return {
    enableJoin,
    join,
    isConnected,
    preview,
  };
};
