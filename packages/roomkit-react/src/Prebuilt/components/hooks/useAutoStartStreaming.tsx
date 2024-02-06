import { useCallback, useEffect, useRef } from 'react';
import {
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
  const { isHLSRunning, isRTMPRunning, isHLSRecordingOn, isBrowserRecordingOn } = useRecordingStreaming();
  const streamStartedRef = useRef(false);

  const startHLS = useCallback(async () => {
    try {
      if (
        isHLSStarted ||
        !showStreamingUI ||
        isHLSRunning ||
        isRTMPRunning ||
        isHLSRecordingOn ||
        isBrowserRecordingOn
      ) {
        return;
      }
      setHLSStarted(true);
      streamStartedRef.current = true;
      await hmsActions.startHLSStreaming();
    } catch (error) {
      console.error(error);
      streamStartedRef.current = false;
      setHLSStarted(false);
    }
  }, [
    hmsActions,
    isHLSRunning,
    isHLSStarted,
    setHLSStarted,
    showStreamingUI,
    isRTMPRunning,
    isHLSRecordingOn,
    isBrowserRecordingOn,
  ]);

  useEffect(() => {
    if (!isHLSStarted && !isHLSRunning) {
      streamStartedRef.current = false;
    }
  }, [isHLSStarted, isHLSRunning]);

  useEffect(() => {
    if (!isConnected || streamStartedRef.current || !permissions?.hlsStreaming) {
      return;
    }
    // Is a streaming kit and peer with streaming permissions joins
    startHLS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);
};
