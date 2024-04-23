import React from 'react';
import { selectAppData, selectIsEffectsEnabled, selectIsLocalVideoEnabled, useHMSStore } from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Loading } from '../../../Loading';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { APP_DATA, isSafari, SIDE_PANE_OPTIONS } from '../../common/constants';

export const VBToggle = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const isVBOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.VB);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isEffectsEnabled = useHMSStore(selectIsEffectsEnabled);
  const loadingEffects = useHMSStore(selectAppData(APP_DATA.loadingEffects));

  if (!isVideoOn || (!isEffectsEnabled && isSafari)) {
    return null;
  }

  return (
    <Tooltip side="top" disabled={isVBOpen} title="Configure Virtual Background">
      <IconButton active={!isVBOpen} onClick={toggleVB} data-testid="virtual_bg_btn">
        {loadingEffects ? <Loading size={18} /> : <VirtualBackgroundIcon />}
      </IconButton>
    </Tooltip>
  );
};
