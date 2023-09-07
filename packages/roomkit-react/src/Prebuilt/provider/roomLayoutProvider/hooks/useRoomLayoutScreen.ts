import {
  ConferencingScreen,
  DefaultPreviewScreen_Elements,
  LeaveScreen,
  PreviewScreen,
  Screens,
} from '@100mslive/types-prebuilt';
import { useRoomLayout } from '..';

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

export function useRoomLayoutPreviewScreen() {
  const screenProps = useRoomLayoutScreen({ screen: 'preview' });
  const isPreviewScreenEnabled = !!screenProps;
  let elements: DefaultPreviewScreen_Elements | undefined;
  let screenType: keyof PreviewScreen | undefined;
  if (isPreviewScreenEnabled) {
    screenType = Object.keys(screenProps)[0] as keyof PreviewScreen;
    elements = screenProps[screenType]?.elements;
  }
  return {
    isPreviewScreenEnabled,
    elements,
    screenType,
  };
}

export function useRoomLayoutConferencingScreen() {
  const screenProps = useRoomLayoutScreen({ screen: 'conferencing' }) || {};
  const screenType = Object.keys(screenProps)[0] as keyof ConferencingScreen;
  const elements = screenProps[screenType]?.elements;
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
