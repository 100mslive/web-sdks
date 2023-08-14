import React, { useCallback, useMemo } from 'react';
import data from '@emoji-mart/data/sets/14/apple.json';
import { init } from 'emoji-mart';
import {
  selectAvailableRoleNames,
  selectLocalPeerID,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { Flex } from '../../../Layout';
import { styled } from '../../../Theme';
import { ToastManager } from '../Toast/ToastManager';
import { useHLSViewerRole } from '../AppData/useUISettings';
import { EMOJI_REACTION_TYPE } from '../../common/constants';

init({ data });

// When changing emojis in the grid, keep in mind that the payload used in sendHLSTimedMetadata has a limit of 100 characters. Using bigger emoji Ids can cause the limit to be exceeded.
const emojiReactionList = [
  [{ emojiId: '+1' }, { emojiId: '-1' }, { emojiId: 'wave' }, { emojiId: 'clap' }, { emojiId: 'fire' }],
  [{ emojiId: 'tada' }, { emojiId: 'heart_eyes' }, { emojiId: 'joy' }, { emojiId: 'open_mouth' }, { emojiId: 'sob' }],
];

export const EmojiCard = () => {
  const hmsActions = useHMSActions();
  const roles = useHMSStore(selectAvailableRoleNames);
  const localPeerId = useHMSStore(selectLocalPeerID);
  const hlsViewerRole = useHLSViewerRole();
  const { isStreamingOn } = useRecordingStreaming();
  const filteredRoles = useMemo(() => roles.filter(role => role !== hlsViewerRole), [roles, hlsViewerRole]);

  const onEmojiEvent = useCallback(data => {
    window.showFlyingEmoji(data?.emojiId, data?.senderId);
  }, []);

  const { sendEvent } = useCustomEvent({
    type: EMOJI_REACTION_TYPE,
    onEvent: onEmojiEvent,
  });

  const sendReaction = async emojiId => {
    const data = {
      type: EMOJI_REACTION_TYPE,
      emojiId: emojiId,
      senderId: localPeerId,
    };
    sendEvent(data, { roleNames: filteredRoles });
    if (isStreamingOn) {
      try {
        await hmsActions.sendHLSTimedMetadata([
          {
            payload: JSON.stringify(data),
            duration: 2,
          },
        ]);
      } catch (error) {
        console.log(error);
        ToastManager.addToast({ title: error.message });
      }
    }
  };
  return emojiReactionList.map((emojiLine, index) => (
    <Flex key={index} justify="between" css={{ mb: '$8' }}>
      {emojiLine.map(emoji => (
        <EmojiContainer key={emoji.emojiId} onClick={() => sendReaction(emoji.emojiId)}>
          <em-emoji id={emoji.emojiId} size="100%" set="apple"></em-emoji>
        </EmojiContainer>
      ))}
    </Flex>
  ));
};

const EmojiContainer = styled('span', {
  position: 'relative',
  cursor: 'pointer',
  width: '$16',
  height: '$16',
  p: '$4',
  '&:hover': {
    p: '7px',
    bg: '$surface_brighter',
    borderRadius: '$1',
  },
});
