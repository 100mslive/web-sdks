import { useMemo } from 'react';
import {
  ConferencingScreen,
  DefaultConferencingScreen_Elements,
  DefaultPreviewScreen_Elements,
  HLSLiveStreamingScreen_Elements,
  LeaveScreen,
  PreviewScreen,
  Screens,
} from '@100mslive/types-prebuilt';
import {
  selectHLSState,
  selectPeerCount,
  selectRoomStartTime,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { useRoomLayout } from '..';
// @ts-ignore
import { getFormattedCount } from '../../../common/utils';

export type useRoomLayoutScreenProps = {
  screen: keyof Screens;
};

type useRoomLayoutScreenReturnType<T extends useRoomLayoutScreenProps> = T['screen'] extends 'conferencing'
  ? ConferencingScreen
  : T['screen'] extends 'leave'
  ? LeaveScreen
  : T['screen'] extends 'preview'
  ? PreviewScreen
  : undefined;

function useRoomLayoutScreen<T extends useRoomLayoutScreenProps>({
  screen,
}: T): useRoomLayoutScreenReturnType<T> | undefined {
  const roomLayout = useRoomLayout();
  const screenProps = roomLayout?.screens?.[screen] as useRoomLayoutScreenReturnType<T> | undefined;
  return screenProps;
}

type PreviewKeys = Omit<PreviewScreen, 'skip_preview_screen'>;

export function useRoomLayoutPreviewScreen() {
  const screenProps = useRoomLayoutScreen({ screen: 'preview' });
  const isPreviewScreenEnabled = !!screenProps && !screenProps?.skip_preview_screen;
  let elements: DefaultPreviewScreen_Elements | undefined;
  let screenType: keyof PreviewKeys | undefined;
  if (isPreviewScreenEnabled) {
    screenType = Object.keys(screenProps).filter(key => key !== 'skip_preview_screen')[0] as keyof PreviewKeys;
    elements = screenProps[screenType]?.elements;
  }
  return {
    isPreviewScreenEnabled,
    elements,
    screenType,
  };
}

export type ConferencingScreenElements = DefaultConferencingScreen_Elements & HLSLiveStreamingScreen_Elements;

export function useRoomLayoutConferencingScreen() {
  const screenProps = useRoomLayoutScreen({ screen: 'conferencing' }) || {};
  const screenType = Object.keys(screenProps)[0] as keyof ConferencingScreen;
  const elements = screenProps[screenType]?.elements as ConferencingScreenElements;
  // @ts-ignore
  const hideSections: string[] = screenProps[screenType]?.hideSections || [];
  return {
    hideSections,
    elements,
    screenType,
  };
}

export function useRoomLayoutLeaveScreen() {
  const screenProps = useRoomLayoutScreen({ screen: 'leave' });
  const isLeaveScreenEnabled = !!screenProps;
  return {
    isLeaveScreenEnabled,
  };
}

export function useRoomLayoutHeader() {
  const { elements } = useRoomLayoutConferencingScreen();
  // return elements.header;
  const { isRecordingOn } = useRecordingStreaming();
  const peerCount = useHMSStore(selectPeerCount);
  const sessionStartedAt = useHMSStore(selectRoomStartTime);
  const hlsState = useHMSStore(selectHLSState);

  // People watching, start timestamp, recording status
  const details = useMemo(() => {
    const details = [];
    if (hlsState?.variants[0]?.['startedAt']) {
      details.push(`${getFormattedCount(peerCount)} watching`);
      details.push(hlsState.variants[0]['startedAt']);
    } else if (sessionStartedAt) {
      details.push(sessionStartedAt);
    }
    if (isRecordingOn) {
      details.push('Recording');
    }
    return details;
  }, [hlsState?.variants, isRecordingOn, peerCount, sessionStartedAt]);

  return {
    title: elements.header?.title || '',
    description: elements.header?.description || '',
    details,
  };
}
