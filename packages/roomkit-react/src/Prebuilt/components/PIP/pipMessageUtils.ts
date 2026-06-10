import { HMSMessage } from '@100mslive/react-sdk';

export interface PIPIncomingMessage {
  senderName: string;
  text: string;
}

export interface PickIncomingMessageResult {
  /** the incoming message to show as a bubble, or null when there is none */
  message: PIPIncomingMessage | null;
  /** id to advance `lastShownMessageId` to (past every message just scanned) */
  lastShownMessageId: string | undefined;
}

/**
 * Pick the newest incoming text message that arrived after `lastShownMessageId`.
 *
 * Chat messages are appended to the store in batches (the store debounces the
 * 'newMessage' action by ~150ms), so a single subscription fire can carry
 * several new messages. We therefore scan every message appended since we last
 * looked rather than just the tail — inspecting only the last entry would drop
 * incoming messages whenever a batch ends with our own or a non-text message.
 *
 * Always returns the id to advance to (past every message scanned this fire) so
 * the caller never re-inspects the same messages, regardless of whether one is
 * worth showing.
 *
 * @param messages ordered list of all messages from `selectHMSMessages`
 * @param lastShownMessageId id of the last message we considered (or undefined)
 * @param localPeerId id of the local peer, to exclude our own messages
 */
export function pickIncomingMessage(
  messages: HMSMessage[] | undefined,
  lastShownMessageId: string | undefined,
  localPeerId: string | undefined,
): PickIncomingMessageResult {
  if (!messages?.length) {
    return { message: null, lastShownMessageId };
  }
  const lastShownIndex = messages.findIndex(message => message.id === lastShownMessageId);
  const freshMessages = messages.slice(lastShownIndex + 1);
  if (!freshMessages.length) {
    return { message: null, lastShownMessageId };
  }
  const newLastShownMessageId = messages[messages.length - 1].id;
  const latestIncoming = [...freshMessages]
    .reverse()
    .find(
      message =>
        message.sender &&
        message.sender !== localPeerId &&
        typeof message.message === 'string' &&
        message.message.trim().length > 0,
    );
  return {
    message: latestIncoming
      ? { senderName: latestIncoming.senderName || 'Anonymous', text: latestIncoming.message }
      : null,
    lastShownMessageId: newLastShownMessageId,
  };
}
