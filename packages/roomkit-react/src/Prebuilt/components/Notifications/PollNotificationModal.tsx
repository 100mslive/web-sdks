import React, { useEffect } from 'react';
import {
  HMSNotificationTypes,
  selectLocalPeerID,
  selectPeerNameByID,
  useHMSNotifications,
  useHMSStore,
  useHMSVanillaStore,
} from '@100mslive/react-sdk';
import { Button } from '../../../Button';
// @ts-ignore: No implicit Any
import { ToastManager } from '../Toast/ToastManager';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore: No implicit Any
import { usePollViewToggle } from '../AppData/useSidepane';

const notificationTypes = [HMSNotificationTypes.POLL_STARTED, HMSNotificationTypes.POLL_STOPPED];

const pollToastKey: Record<string, string> = {};

export const PollNotificationModal = () => {
  const togglePollView = usePollViewToggle();
  const localPeerID = useHMSStore(selectLocalPeerID);
  const vanillaStore = useHMSVanillaStore();
  const screenProps = useRoomLayoutConferencingScreen();

  const notification = useHMSNotifications(notificationTypes);

  useEffect(() => {
    switch (notification?.type) {
      case HMSNotificationTypes.POLL_STARTED:
        if (notification.data.startedBy !== localPeerID && screenProps.screenType !== 'hls_live_streaming') {
          const pollStartedBy = vanillaStore.getState(selectPeerNameByID(notification.data.startedBy)) || 'Participant';

          const pollToastID = ToastManager.addToast({
            title: `${pollStartedBy} started a ${notification.data.type}: ${notification.data.title}`,
            action: (
              <Button
                onClick={() => togglePollView(notification.data.id)}
                variant="standard"
                css={{
                  backgroundColor: 'surface.bright',
                  fontWeight: '$semiBold',
                  color: 'onSurface.high',
                  p: '$xs $md',
                }}
              >
                {notification.data.type === 'quiz' ? 'Answer' : 'Vote'}
              </Button>
            ),
            duration: Infinity,
          });
          pollToastKey[notification.data.id] = pollToastID;
        }
        break;
      case HMSNotificationTypes.POLL_STOPPED:
        {
          const pollID = notification?.data.id;
          if (pollID && pollToastKey?.[pollID]) {
            ToastManager.removeToast(pollToastKey?.[notification.data.id]);
            delete pollToastKey[notification?.data.id];
          }
        }
        break;
      default:
        break;
    }
  }, [notification]);

  return null;
};
