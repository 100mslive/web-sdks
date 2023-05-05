import { useCallback, useEffect } from 'react';
import { HMSNotificationTypes, HMSPeerID, HMSRoleName } from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { useHMSActions, useHMSVanillaNotifications } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

export interface useCustomEventInput<T> {
  /**
   * type of the event, for example, MODERATOR_EVENT, EMOJI_REACTIONS etc.
   */
  type: string;
  /**
   * the handler function for when the custom event comes. It's recommended
   * to use `useCallback` for the function passed in here for performance
   * reasons.
   * The callback is optional in case you want to decouple sending event and
   * handling event in the UI.
   */
  onEvent?: (data: T) => void;
  /**
   * flag to treat event payload as json.
   * If true, the payload will be stringified before sending and
   * parsed before calling the onEvent handler function.
   *
   * Set it to `false` if you want to send/receive only string messages
   *
   * Set it to `true` if you want to send/receive objects
   *
   * default value is true
   */
  json?: boolean;
  /**
   * function to handle errors happening during sending the event
   */
  handleError?: hooksErrHandler;
}

export interface EventReceiver {
  peerId?: HMSPeerID;
  roleNames?: HMSRoleName[];
}

export interface useCustomEventResult<T> {
  /**
   * sends the event data to others in the room who will receive it in onEvent
   *
   * @example to send message to peers of specific roles
   * ```js
   * sendEvent(data, {roleNames: ['host','guest']})
   * ```
   *
   * @example to send message to single peer
   * ```js
   * sendEvent(data, {peerId})
   * ```
   */
  sendEvent: (data: T, receiver?: EventReceiver) => void;
}

const stringifyData = <T>(data: T, json: boolean) => (json ? JSON.stringify(data || '') : (data as unknown as string));

/**
 * A generic function to implement [custom events](https://www.100ms.live/docs/javascript/v2/features/chat#custom-events) in your UI.
 * The data to be sent to remote is expected to be a serializable JSON. The serialization
 * and deserialization is taken care of by the hook.
 */
export const useCustomEvent = <T>({
  type,
  json = true,
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
          const data = json ? JSON.parse(msg.message) : msg.message;
          onEvent?.(data as T);
        } catch (err) {
          handleError(err as Error, 'handleCustomEvent');
        }
      }
    }, HMSNotificationTypes.NEW_MESSAGE);
    return unsubscribe;
  }, [notifications, type, json, onEvent, handleError]);

  // this is to send message to remote peers, peers of specific role or single peer, and call onEvent
  const sendEvent = useCallback(
    async (data: T, receiver?: EventReceiver) => {
      try {
        const dataStr = stringifyData<T>(data, json);
        if (receiver && Array.isArray(receiver?.roleNames)) {
          await actions.sendGroupMessage(dataStr, receiver.roleNames, type);
        } else if (typeof receiver?.peerId === 'string') {
          await actions.sendDirectMessage(dataStr, receiver.peerId, type);
        } else {
          await actions.sendBroadcastMessage(dataStr, type);
        }
        onEvent?.(data);
      } catch (err) {
        handleError(err as Error, 'sendCustomEvent');
      }
    },
    [actions, handleError, onEvent, type, json],
  );

  return { sendEvent };
};
