import { HMSRoomState, selectIsConnectedToRoom, selectRoomState } from '@100mslive/hms-video-store';
import { useCallback, useEffect } from 'react';
import { useHMSActions, useHMSStore } from '../hooks/HmsRoomProvider';
import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';

export interface usePreviewInput {
  /**
   * name of user who is joining
   */
  name: string;
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
}

/**
 * this hook can be used to build a preview UI component, this lets you call preview everytime the passed in
 * token changes. This hook is best used in combination with useDevices for changing devices and useAVToggle for
 * muting/unmuting. Any device change or mute/unmute will be carried across to join.
 */
export const usePreview = ({
  name,
  token,
  metadata,
  handleError = logErrorHandler,
}: usePreviewInput): usePreviewResult => {
  const actions = useHMSActions();
  const roomState = useHMSStore(selectRoomState);
  const isConnected = useHMSStore(selectIsConnectedToRoom) || false;
  const enableJoin = roomState === HMSRoomState.Preview;
  useEffect(() => {
    (async () => {
      if (!token || roomState !== HMSRoomState.Disconnected) {
        return;
      }
      try {
        await actions.preview({
          userName: name,
          authToken: token,
          rememberDeviceSelection: true,
        });
      } catch (err) {
        handleError(err as Error, 'preview');
      }
    })();
  }, [roomState, actions, token]);

  const join = useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      await actions.join({
        userName: name,
        authToken: token,
        metaData: metadata,
        rememberDeviceSelection: true,
      });
    } catch (err) {
      handleError(err as Error, 'join');
    }
  }, [actions, token]);

  return {
    enableJoin,
    join,
    isConnected,
  };
};
