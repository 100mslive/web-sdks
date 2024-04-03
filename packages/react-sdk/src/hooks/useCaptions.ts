import { useEffect } from 'react';
import { HMSNotificationTypes } from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { useHMSActions, useHMSVanillaNotifications } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

export interface CaptionData {
  start: number;
  end: number;
  peer_id: string;
  final: boolean;
  transcript: string;
}

export interface useCaptionsInput {
  onTranscript?: (data: CaptionData[]) => void;
  handleError?: hooksErrHandler;
}

/**
 * A generic function to implement [custom events](https://www.100ms.live/docs/javascript/v2/features/chat#custom-events) in your UI.
 * The data to be sent to remote is expected to be a serializable JSON. The serialization
 * and deserialization is taken care of by the hook.
 */
export const useCaptions = ({ onTranscript, handleError = logErrorHandler }: useCaptionsInput) => {
  const type = 'transcript';
  const actions = useHMSActions();
  const notifications = useHMSVanillaNotifications();

  useEffect(() => {
    // here to ignore message on captions
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
          const message = JSON.parse(msg.message);
          const data = message.results as CaptionData[];
          onTranscript?.(data);
        } catch (err) {
          handleError(err as Error, 'handleCaptionEvent');
        }
      }
    }, HMSNotificationTypes.NEW_MESSAGE);
    return unsubscribe;
  }, [notifications, type, handleError, onTranscript]);

  return;
};
