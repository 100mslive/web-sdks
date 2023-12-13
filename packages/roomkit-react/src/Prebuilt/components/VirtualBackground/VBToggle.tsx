import React from 'react';
import { selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
// @ts-ignore: No implicit any
import IconButton from '../../IconButton';
// @ts-ignore: No implicit any
import { ActionTile } from '../MoreSettings/ActionTile';
// @ts-ignore: No implicit any
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { isSafari, SIDE_PANE_OPTIONS } from '../../common/constants';

export const VBToggle = ({ asActionTile = false, onClick }: { asActionTile?: boolean; onClick?: () => void }) => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const isVBOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.VB);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  if (!isVideoOn || isSafari) {
    return null;
  }

  if (asActionTile) {
    return (
      <ActionTile.Root
        data-testid="virtual_bg_btn"
        onClick={() => {
          toggleVB();
          onClick?.();
        }}
      >
        <VirtualBackgroundIcon />
        <ActionTile.Title>Virtual Background</ActionTile.Title>
      </ActionTile.Root>
    );
  }

  return (
    <Tooltip side="top" disabled={isVBOpen} title="Configure Virtual Background">
      <IconButton active={!isVBOpen} onClick={toggleVB} data-testid="virtual_bg_btn">
        <VirtualBackgroundIcon />
      </IconButton>
    </Tooltip>
  );
};
