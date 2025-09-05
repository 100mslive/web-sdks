import React, { useState } from 'react';
import { useMedia } from 'react-use';
import data from '@emoji-mart/data/sets/14/apple.json';
import { init } from 'emoji-mart';
import {
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectLocalPeerID,
  useCustomEvent,
  useHMSStore,
} from '@100mslive/react-sdk';
import { EmojiIcon } from '@100mslive/react-icons';
import { EmojiCard } from './Footer/EmojiCard';
// import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Box } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useRoomLayoutConferencingScreen } from '../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
import { useDropdownList } from './hooks/useDropdownList';
import { useLandscapeHLSStream, useMobileHLSStream } from '../common/hooks';
import { EMOJI_REACTION_TYPE } from '../common/constants';

init({ data });

export const EmojiReaction = ({ showCard = false }) => {
  const [open, setOpen] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const { elements } = useRoomLayoutConferencingScreen();
  useDropdownList({ open: open, name: 'EmojiReaction' });
  // const hmsActions = useHMSActions();
  const roles = useHMSStore(selectAvailableRoleNames);
  const localPeerId = useHMSStore(selectLocalPeerID);
  // const { isStreamingOn } = useRecordingStreaming();
  const isMobile = useMedia(cssConfig.media.md);
  const isLandscape = useMedia(cssConfig.media.ls);
  const isMobileHLSStream = useMobileHLSStream();
  const isLandscapeStream = useLandscapeHLSStream();

  const { sendEvent } = useCustomEvent({
    type: EMOJI_REACTION_TYPE,
  });

  const sendReaction = async emojiId => {
    const data = {
      type: EMOJI_REACTION_TYPE,
      emojiId: emojiId,
      senderId: localPeerId,
    };
    // TODO: RT find a way to figure out hls-viewer roles
    sendEvent(data, { roleNames: roles });
    window.showFlyingEmoji?.({ emojiId, senderId: localPeerId });
    /* if (isStreamingOn) {
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
    } */
  };

  if (!isConnected || !elements.emoji_reactions) {
    return null;
  }

  if (showCard) {
    return <EmojiCard sendReaction={sendReaction} />;
  }
  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild data-testid="emoji_reaction_btn">
        <IconButton
          css={isMobile || isLandscape ? { bg: 'surface.default', r: 'round', border: '1px solid border.bright' } : {}}
        >
          <Tooltip title="Emoji reaction">
            <Box>
              <EmojiIcon />
            </Box>
          </Tooltip>
        </IconButton>
      </Dropdown.Trigger>
      <Dropdown.Content
        sideOffset={5}
        align={isMobileHLSStream || isLandscapeStream ? 'end' : 'center'}
        css={{ p: '8', bg: 'surface.default' }}
      >
        <EmojiCard sendReaction={sendReaction} />
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
