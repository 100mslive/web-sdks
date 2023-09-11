import { useCallback, useMemo } from 'react';
import {
  HMSConfigInitialSettings,
  HMSPreviewConfig,
  HMSRoomState,
  selectIsConnectedToRoom,
  selectRoomState,
} from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

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
  asRole?: string;
  /**
   * if this flag is enabled, the SDK takes care of unsubscribing to the video when it goes out of view.
   * Additionally if simulcast is enabled, it takes care of auto managing simulcast layers based on the
   * dimensions of the video element to conserve bandwidth.
   */
  autoManageVideo?: boolean;
  /**
   * if this flag is enabled, wake lock will be acquired automatically(if supported) when joining the room, so the device
   * will be kept awake.
   */
  autoManageWakeLock?: boolean;
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
 * This hook can be used to build a preview UI component, this lets you call preview every time the passed in
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
  asRole,
  autoManageVideo,
  autoManageWakeLock,
}: usePreviewInput): usePreviewResult => {
  const actions = useHMSActions();
  const roomState = useHMSStore(selectRoomState);
  const isConnected = useHMSStore(selectIsConnectedToRoom) || false;
  const enableJoin = roomState === HMSRoomState.Preview;

  const config: HMSPreviewConfig = useMemo(() => {
    return {
      userName: name,
      authToken: token,
      metaData: metadata,
      rememberDeviceSelection: true,
      settings: initialSettings,
      initEndpoint: initEndpoint,
      asRole,
      captureNetworkQualityInPreview,
      autoManageVideo,
      autoManageWakeLock,
    };
  }, [
    name,
    token,
    metadata,
    initEndpoint,
    initialSettings,
    captureNetworkQualityInPreview,
    asRole,
    autoManageVideo,
    autoManageWakeLock,
  ]);

  const preview = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      if (isConnected || roomState !== HMSRoomState.Disconnected) {
        await actions.leave().catch(() => {
          // Do nothing as this might lead to leave called before join
        });
      }
      await actions.preview(config);
    } catch (err) {
      handleError(err as Error, 'preview');
    }
  }, [token, isConnected, roomState, actions, config, handleError]);

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
