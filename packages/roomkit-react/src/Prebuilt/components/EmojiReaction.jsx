import React, { Fragment, useState } from 'react';
import { useMedia } from 'react-use';
import data from '@emoji-mart/data/sets/14/apple.json';
import { init } from 'emoji-mart';
import {
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectLocalPeerID,
  useCustomEvent,
  // useHMSActions,
  useHMSStore,
  // useRecordingStreaming,
} from '@100mslive/react-sdk';
import { EmojiIcon } from '@100mslive/react-icons';
import { EmojiCard } from './Footer/EmojiCard';
// import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Box } from '../../Layout';
import { config as cssConfig } from '../../Theme';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useDropdownList } from './hooks/useDropdownList';
import { EMOJI_REACTION_TYPE } from '../common/constants';

init({ data });

export const EmojiReaction = () => {
  const [open, setOpen] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  useDropdownList({ open: open, name: 'EmojiReaction' });
  // const hmsActions = useHMSActions();
  const roles = useHMSStore(selectAvailableRoleNames);
  const localPeerId = useHMSStore(selectLocalPeerID);
  // const { isStreamingOn } = useRecordingStreaming();
  const isMobile = useMedia(cssConfig.media.md);

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

  if (!isConnected) {
    return null;
  }
  return isMobile ? (
    <EmojiCard sendReaction={sendReaction} />
  ) : (
    <Fragment>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <Dropdown.Trigger asChild data-testid="emoji_reaction_btn">
          <IconButton>
            <Tooltip title="Emoji reaction">
              <Box>
                <EmojiIcon />
              </Box>
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content sideOffset={5} align="center" css={{ p: '$8', bg: '$surface_default' }}>
          <EmojiCard sendReaction={sendReaction} />
        </Dropdown.Content>
      </Dropdown.Root>
    </Fragment>
  );
};
