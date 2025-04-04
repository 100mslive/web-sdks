import React, { useEffect, useMemo, useRef } from 'react';
import { useMedia } from 'react-use';
import {
  HMSRoomState,
  selectFullAppData,
  selectHLSState,
  selectRoomState,
  selectRTMPState,
  useAVToggle,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { config as cssConfig } from '../../../Theme';
import { LayoutMode } from '../Settings/LayoutSettings';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
//@ts-ignore
import { UserPreferencesKeys, useUserPreferences } from '../hooks/useUserPreferences';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from './useSidepane';
// @ts-ignore
import { useSetAppDataByKey, useSetNoiseCancellation } from './useUISettings';
import {
  APP_DATA,
  CHAT_SELECTOR,
  POLL_STATE,
  SIDE_PANE_OPTIONS,
  UI_MODE_GRID,
  UI_SETTINGS,
} from '../../common/constants';
import { DEFAULT_TILES_IN_VIEW } from '../MoreSettings/constants';

const initialAppData = {
  [APP_DATA.uiSettings]: {
    [UI_SETTINGS.isAudioOnly]: false,
    [UI_SETTINGS.maxTileCount]: DEFAULT_TILES_IN_VIEW.DESKTOP,
    [UI_SETTINGS.showStatsOnTiles]: false,
    [UI_SETTINGS.enableAmbientMusic]: false,
    [UI_SETTINGS.uiViewMode]: UI_MODE_GRID,
    [UI_SETTINGS.mirrorLocalVideo]: true,
    [UI_SETTINGS.layoutMode]: LayoutMode.GALLERY,
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
  [APP_DATA.sheet]: '',
  [APP_DATA.hlsStarted]: false,
  [APP_DATA.rtmpStarted]: false,
  [APP_DATA.recordingStarted]: false,
  [APP_DATA.dropdownList]: [],
  [APP_DATA.authToken]: '',
  [APP_DATA.minimiseInset]: false,
  [APP_DATA.activeScreensharePeerId]: '',
  [APP_DATA.disableNotifications]: false,
  [APP_DATA.loadingEffects]: false,
  [APP_DATA.background]: 'none',
  [APP_DATA.pollState]: {
    [POLL_STATE.pollInView]: '',
    [POLL_STATE.view]: '',
  },
  // by default on because of on demand now, for beam disabled
  [APP_DATA.caption]: false,
  [APP_DATA.noiseCancellation]: false,
};

export const AppData = React.memo(() => {
  const hmsActions = useHMSActions();
  const [preferences = {}] = useUserPreferences(UserPreferencesKeys.UI_SETTINGS);
  const appData = useHMSStore(selectFullAppData);
  const { elements } = useRoomLayoutConferencingScreen();
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const { isLocalVideoEnabled } = useAVToggle();
  const sidepaneOpenedRef = useRef(false);
  const [, setNoiseCancellationEnabled] = useSetNoiseCancellation();
  const isMobile = useMedia(cssConfig.media.md);

  useEffect(() => {
    if (elements?.noise_cancellation?.enabled_by_default) {
      setNoiseCancellationEnabled(true);
    }
  }, [elements?.noise_cancellation?.enabled_by_default, setNoiseCancellationEnabled]);

  const defaultMediaURL = useMemo(() => {
    const media = elements?.virtual_background?.background_media || [];
    for (let i = 0; i < media.length; i++) {
      if (media[i].default && media[i].url) {
        return media[i].url;
      }
    }
    return '';
  }, [elements?.virtual_background?.background_media]);

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
  }, [hmsActions, preferences]);

  // mobile does not allow custom maxTileCount
  useEffect(() => {
    if (isMobile) {
      hmsActions.setAppData(APP_DATA.uiSettings, { [UI_SETTINGS.maxTileCount]: DEFAULT_TILES_IN_VIEW.MWEB }, true);
    }
  }, [hmsActions, isMobile]);

  useEffect(() => {
    if (!preferences.subscribedNotifications) {
      return;
    }
    hmsActions.setAppData(APP_DATA.subscribedNotifications, preferences.subscribedNotifications, true);
  }, [preferences.subscribedNotifications, hmsActions]);

  useEffect(() => {
    if (defaultMediaURL && !sidepaneOpenedRef.current && isLocalVideoEnabled) {
      hmsActions.setAppData(APP_DATA.background, defaultMediaURL);
      sidepaneOpenedRef.current = true;
      toggleVB();
    }
  }, [hmsActions, toggleVB, isLocalVideoEnabled, defaultMediaURL]);

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
