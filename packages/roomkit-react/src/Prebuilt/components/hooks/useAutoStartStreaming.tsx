import { useCallback, useEffect, useRef } from 'react';
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
  const streamStartedRef = useRef(false);

  const startHLS = useCallback(async () => {
    try {
      if (isHLSStarted || !showStreamingUI || isHLSRunning) {
        return;
      }
      setHLSStarted(true);
      streamStartedRef.current = true;
      await hmsActions.startHLSStreaming();
    } catch (error) {
      if ((error as HMSException).message?.includes('beam already started')) {
        return;
      }
      streamStartedRef.current = false;
      setHLSStarted(false);
    }
  }, [hmsActions, isHLSRunning, isHLSStarted, setHLSStarted, showStreamingUI]);

  useEffect(() => {
    if (!isHLSStarted && !isHLSRunning) {
      streamStartedRef.current = false;
    }
  }, [isHLSStarted, isHLSRunning]);

  useEffect(() => {
    if (!isConnected || streamStartedRef.current || !permissions?.hlsStreaming) {
      return;
    }
    // Is a streaming kit and broadcaster joins
    startHLS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);
};
