import { useHMSActions, useHMSVanillaNotifications } from '../primitives/HmsRoomProvider';
import { useCallback, useEffect } from 'react';
import { HMSNotificationTypes } from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { logErrorHandler } from '../utils/commons';

export interface useCustomEventInput<T> {
  /**
   * type of the event, e.g. MODERATOR_EVENT, EMOJI_REACTIONS etc.
   */
  type: string;
  /**
   * the handler function for when the custom event comes. It's recommended
   * to use `useCallback` for the function passed in here for performance
   * reasons.
   */
  onEvent: (data: T) => void;
  /**
   * function to handle errors happening during sending the event
   */
  handleError?: hooksErrHandler;
}

export interface useCustomEventResult<T> {
  /**
   * sends the event data to others in the room who will receive it in onEvent
   */
  sendEvent: (data: T) => void;
}

/**
 * A generic function to implement [custom events](https://www.100ms.live/docs/javascript/v2/features/chat#custom-events) in your UI.
 * The data to be sent to remote is expected to be a serializable JSON. The serialization
 * and deserialization is taken care of by the hook.
 */
export const useCustomEvent = <T>({
  type,
  onEvent,
  handleError = logErrorHandler,
}: useCustomEventInput<T>): useCustomEventResult<T> => {
  const actions = useHMSActions();
  const notifications = useHMSVanillaNotifications();

  useEffect(() => {
    // we don't want these messages to be stored in store reserving that for chat messages
    actions.ignoreMessageTypes([type]);
  }, [actions, type]);

  // this is to handle messages from remote peers
  useEffect(() => {
    if (!notifications) {
      return;
    }
    const unsubscribe = notifications.onNotification(notification => {
      const msg = notification.data;
      if (msg && msg.type === type) {
        try {
          const data = JSON.parse(msg.message);
          onEvent(data as T);
        } catch (err) {
          handleError(err as Error, 'handleCustomEvent');
        }
      }
    }, HMSNotificationTypes.NEW_MESSAGE);
    return unsubscribe;
  }, [notifications, type, onEvent, handleError]);

  // this is to send message to remote peers and call onEvent
  const sendEvent = useCallback(
    async (data: T) => {
      try {
        const dataStr = JSON.stringify(data || '');
        await actions.sendBroadcastMessage(dataStr, type);
        onEvent(data);
      } catch (err) {
        handleError(err as Error, 'sendCustomEvent');
      }
    },
    [actions, handleError, onEvent, type],
  );

  return { sendEvent };
};
