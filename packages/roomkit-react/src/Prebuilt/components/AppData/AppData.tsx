import React, { useEffect } from 'react';
import {
  HMSRoomState,
  selectFullAppData,
  selectHLSState,
  selectRoomState,
  selectRTMPState,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
//@ts-ignore
import { UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from './useSidepane';
// @ts-ignore
import { useSetAppDataByKey } from './useUISettings';
import {
  APP_DATA,
  CHAT_SELECTOR,
  DEFAULT_VB_STATES,
  DEFAULT_WAITING_VIEWER_ROLE,
  POLL_STATE,
  SIDE_PANE_OPTIONS,
  UI_MODE_GRID,
  UI_SETTINGS,
} from '../../common/constants';

const initialAppData = {
  [APP_DATA.uiSettings]: {
    [UI_SETTINGS.isAudioOnly]: false,
    [UI_SETTINGS.maxTileCount]: 9,
    [UI_SETTINGS.showStatsOnTiles]: false,
    [UI_SETTINGS.enableAmbientMusic]: false,
    [UI_SETTINGS.uiViewMode]: UI_MODE_GRID,
    [UI_SETTINGS.mirrorLocalVideo]: true,
  },
  [APP_DATA.subscribedNotifications]: {
    PEER_JOINED: false,
    PEER_LEFT: false,
    NEW_MESSAGE: true,
    ERROR: true,
    METADATA_UPDATED: true,
  },
  [APP_DATA.chatOpen]: false,
  [APP_DATA.chatSelector]: {
    [CHAT_SELECTOR.ROLE]: '',
    [CHAT_SELECTOR.PEER]: {},
  },
  [APP_DATA.chatDraft]: '',
  [APP_DATA.sidePane]: '',
  [APP_DATA.hlsStarted]: false,
  [APP_DATA.rtmpStarted]: false,
  [APP_DATA.recordingStarted]: false,
  [APP_DATA.waitingViewerRole]: DEFAULT_WAITING_VIEWER_ROLE,
  [APP_DATA.dropdownList]: [],
  [APP_DATA.authToken]: '',
  [APP_DATA.minimiseInset]: false,
  [APP_DATA.activeScreensharePeerId]: '',
  [APP_DATA.disableNotifications]: false,
  [APP_DATA.background]: 'none',
  [APP_DATA.backgroundType]: 'none',
  [APP_DATA.defaultVB]: DEFAULT_VB_STATES.UNSET,
  [APP_DATA.pollState]: {
    [POLL_STATE.pollInView]: '',
    [POLL_STATE.view]: '',
  },
};

export const AppData = React.memo(() => {
  const hmsActions = useHMSActions();
  const [preferences = {}] = useUserPreferences(UserPreferencesKeys.UI_SETTINGS);
  const appData = useHMSStore(selectFullAppData);

  useEffect(() => {
    hmsActions.initAppData({
      ...initialAppData,
      ...appData,
    });
    // @ts-ignore
    hmsActions.setFrameworkInfo({
      type: 'react-web',
      isPrebuilt: true,
      version: React.version,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hmsActions]);

  useEffect(() => {
    const uiSettings = preferences || {};
    const updatedSettings = {
      ...uiSettings,
      [UI_SETTINGS.isAudioOnly]: undefined,
      [UI_SETTINGS.uiViewMode]: uiSettings.uiViewMode || UI_MODE_GRID,
    };
    hmsActions.setAppData(APP_DATA.uiSettings, updatedSettings, true);
  }, [preferences, hmsActions]);

  useEffect(() => {
    if (!preferences.subscribedNotifications) {
      return;
    }
    hmsActions.setAppData(APP_DATA.subscribedNotifications, preferences.subscribedNotifications, true);
  }, [preferences.subscribedNotifications, hmsActions]);

  return <ResetStreamingStart />;
});

/**
 * reset hlsStarted, rtmpStarted values when streaming starts
 */
const ResetStreamingStart = () => {
  const { isHLSRunning, isRTMPRunning, isBrowserRecordingOn } = useRecordingStreaming();
  const hlsError = useHMSStore(selectHLSState).error;
  const rtmpError = useHMSStore(selectRTMPState).error;
  const roomState = useHMSStore(selectRoomState);
  const [hlsStarted, setHLSStarted] = useSetAppDataByKey(APP_DATA.hlsStarted);
  const [recordingStarted, setRecordingStarted] = useSetAppDataByKey(APP_DATA.recordingStarted);
  const [rtmpStarted, setRTMPStarted] = useSetAppDataByKey(APP_DATA.rtmpStarted);
  const toggleStreaming = useSidepaneToggle(SIDE_PANE_OPTIONS.STREAMING);
  const isStreamingOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.STREAMING);

  useEffect(() => {
    if (isBrowserRecordingOn && recordingStarted) {
      setRecordingStarted(false);
    }
  }, [isBrowserRecordingOn, recordingStarted, setRecordingStarted]);
  /**
   * Reset on leave
   */
  useEffect(() => {
    if (roomState === HMSRoomState.Disconnected) {
      setHLSStarted(false);
      setRecordingStarted(false);
      setRTMPStarted(false);
    }
  }, [roomState, setHLSStarted, setRTMPStarted, setRecordingStarted]);
  useEffect(() => {
    if (isHLSRunning || hlsError) {
      if (hlsStarted) {
        setHLSStarted(false);
        if (isStreamingOpen) {
          toggleStreaming();
        }
      }
    }
  }, [isHLSRunning, hlsStarted, setHLSStarted, hlsError, isStreamingOpen, toggleStreaming]);
  useEffect(() => {
    if (isRTMPRunning || rtmpError || isBrowserRecordingOn) {
      if (rtmpStarted) {
        setRTMPStarted(false);
        if (isStreamingOpen) {
          toggleStreaming();
        }
      }
    }
  }, [isRTMPRunning, setRTMPStarted, rtmpStarted, rtmpError, isBrowserRecordingOn, isStreamingOpen, toggleStreaming]);
  return null;
};
