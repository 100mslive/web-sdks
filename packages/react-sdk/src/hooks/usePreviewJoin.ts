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
}

export interface usePreviewResult {
  /**
   * enable the join button for the user only when this is true
   */
  enableJoin: boolean;
  /**
   * call this function to join the room
   */
  join: () => void;
  /**
   * once the user has joined the room, till leave happens this flag will be true. It can be used
   * to decide to show between preview form and conferencing component/video tiles.
   */
  isConnected: boolean;
  /**
   * call this function to join the room
   */
  preview: () => void;
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
    };
  }, [name, token, metadata, initEndpoint, initialSettings]);

  const preview = useCallback(() => {
    (async () => {
      if (!token) {
        return;
      }
      if (roomState !== HMSRoomState.Disconnected) {
        await actions.leave();
      }
      try {
        await actions.preview(config);
      } catch (err) {
        handleError(err as Error, 'preview');
      }
    })();
  }, [actions, handleError, token, roomState, config]);

  const join = useCallback(() => {
    if (!token) {
      return;
    }
    try {
      actions.join(config);
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
