import React, { Fragment, useState } from 'react';
import { selectIsConnectedToRoom, useHMSStore } from '@100mslive/react-sdk';
import { EmojiIcon } from '@100mslive/react-icons';
import { EmojiCard } from './Footer/EmojiCard';
import { Dropdown } from '../../Dropdown';
import { Tooltip } from '../../Tooltip';
import IconButton from '../IconButton';
import { useDropdownList } from './hooks/useDropdownList';
import { useIsFeatureEnabled } from './hooks/useFeatures';
import { FEATURE_LIST } from '../common/constants';

export const EmojiReaction = () => {
  const [open, setOpen] = useState(false);
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const isFeatureEnabled = useIsFeatureEnabled(FEATURE_LIST.EMOJI_REACTION);
  useDropdownList({ open: open, name: 'EmojiReaction' });

  if (!isConnected || !isFeatureEnabled) {
    return null;
  }
  return (
    <Fragment>
      <Dropdown.Root open={open} onOpenChange={setOpen}>
        <Dropdown.Trigger asChild data-testid="emoji_reaction_btn">
          <IconButton>
            <Tooltip title="Emoji reaction">
              <EmojiIcon />
            </Tooltip>
          </IconButton>
        </Dropdown.Trigger>
        <Dropdown.Content sideOffset={5} align="center" css={{ p: '$8', bg: '$surface_default' }}>
          <EmojiCard />
        </Dropdown.Content>
      </Dropdown.Root>
    </Fragment>
  );
};
