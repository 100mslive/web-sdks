import { useEffect } from 'react';
import { HMSNotificationTypes } from '@100mslive/hms-video-store';
import { hooksErrHandler } from './types';
import { useHMSVanillaNotifications } from '../primitives/HmsRoomProvider';
import { logErrorHandler } from '../utils/commons';

export interface HMSTranscript {
  start: number;
  end: number;
  peer_id: string;
  final: boolean;
  transcript: string;
}

export interface useHMSTranscriptInput {
  onTranscript?: (data: HMSTranscript[]) => void;
  handleError?: hooksErrHandler;
}

/**
 * A generic function to implement [custom events](https://www.100ms.live/docs/javascript/v2/features/chat#custom-events) in your UI.
 * The data to be sent to remote is expected to be a serializable JSON. The serialization
 * and deserialization is taken care of by the hook.
 */
export const useTranscript = ({ onTranscript, handleError = logErrorHandler }: useHMSTranscriptInput) => {
  const type = 'hms_transcript';
  const notifications = useHMSVanillaNotifications();

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
          const data = message.results as HMSTranscript[];
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
