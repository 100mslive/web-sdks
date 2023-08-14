import React, { Fragment, useCallback, useMemo, useState } from 'react';
import data from '@emoji-mart/data/sets/14/apple.json';
import { init } from 'emoji-mart';
import {
  selectAvailableRoleNames,
  selectIsConnectedToRoom,
  selectLocalPeerID,
  useCustomEvent,
  useHMSActions,
  useHMSStore,
  useRecordingStreaming,
} from '@100mslive/react-sdk';
import { EmojiIcon } from '@100mslive/react-icons';
import { EmojiCard } from './Footer/EmojiCard';
import { ToastManager } from './Toast/ToastManager';
import { Dropdown } from '../../Dropdown';
import { Box } from '../../Layout';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useHLSViewerRole } from './AppData/useUISettings';
import { useDropdownList } from './hooks/useDropdownList';
import { useIsFeatureEnabled } from './hooks/useFeatures';
import { EMOJI_REACTION_TYPE, FEATURE_LIST } from '../common/constants';

export const EmojiReaction = () => {
  const [open, setOpen] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isFeatureEnabled = useIsFeatureEnabled(FEATURE_LIST.EMOJI_REACTION);
  useDropdownList({ open: open, name: 'EmojiReaction' });
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

  if (!isConnected || !isFeatureEnabled) {
    return null;
  }
  return (
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
