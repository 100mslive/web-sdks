import React, { useEffect } from 'react';
import { selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { useRoomLayoutConferencingScreen } from '../../provider/roomLayoutProvider/hooks/useRoomLayoutScreen';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { isSafari, SIDE_PANE_OPTIONS } from '../../common/constants';
import { DEFAULT_VB_STATE } from './constants';

export const VBToggle = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const isVBOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.VB);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const { elements } = useRoomLayoutConferencingScreen();
  const backgroundMedia = elements?.virtual_background?.background_media;

  useEffect(() => {
    // If default is present, open the VB sidepane
    const defaultMediaPresent = !!backgroundMedia?.some(media => media.default);
    const openedSidepane = !!sessionStorage.getItem(DEFAULT_VB_STATE);

    if (defaultMediaPresent && !openedSidepane) {
      toggleVB();
      sessionStorage.setItem(DEFAULT_VB_STATE, 'opened');
    }
  }, [backgroundMedia, toggleVB]);

  if (!isVideoOn || isSafari) {
    return null;
  }

  return (
    <Tooltip side="top" disabled={isVBOpen} title="Configure Virtual Background">
      <IconButton active={!isVBOpen} onClick={toggleVB} data-testid="virtual_bg_btn">
        <VirtualBackgroundIcon />
      </IconButton>
    </Tooltip>
  );
};
