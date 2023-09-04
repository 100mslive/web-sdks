import { useCallback, useEffect } from 'react';
import {
  HMSException,
  selectIsConnectedToRoom,
  selectPermissions,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from '../AppData/useUISettings';
// @ts-ignore: No implicit Any
import { useShowStreamingUI } from '../../common/hooks';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../../common/constants';

export const useAutoStartStreaming = () => {
  const [isHLSStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const permissions = useHMSStore(selectPermissions);
  const showStreamingUI = useShowStreamingUI();
  const hmsActions = useHMSActions();
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const { isHLSRunning } = useRecordingStreaming();

  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted) {
        return;
      }
      console.log('starting hls called');
      setHLSStarted(true);
      await hmsActions.startHLSStreaming();
    } catch (error) {
      if ((error as HMSException).message?.includes('beam already started')) {
        return;
      }
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSStarted, setHLSStarted]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }
    // Is a streaming kit and broadcaster joins
    if (permissions?.hlsStreaming && !isHLSRunning && showStreamingUI) {
      console.log('start hls called');
      startHLS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);
};
