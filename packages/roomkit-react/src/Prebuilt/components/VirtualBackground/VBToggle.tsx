import React, { useEffect } from 'react';
// eslint-disable-next-line
import { HMSVirtualBackgroundTypes } from '@100mslive/hms-virtual-background/hmsvbplugin';
import {
  selectAppData,
  selectIsEffectsEnabled,
  selectIsLocalVideoEnabled,
  selectIsVBEnabled,
  useAVToggle,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Loading } from '../../../Loading';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { VBHandler } from './VBHandler';
// @ts-ignore
import { useIsSidepaneTypeOpen, useSidepaneToggle } from '../AppData/useSidepane';
import { APP_DATA, isSafari, SIDE_PANE_OPTIONS } from '../../common/constants';

export const VBToggle = () => {
  const toggleVB = useSidepaneToggle(SIDE_PANE_OPTIONS.VB);
  const isVBOpen = useIsSidepaneTypeOpen(SIDE_PANE_OPTIONS.VB);
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isVBEnabled = useHMSStore(selectIsVBEnabled);
  const isEffectsEnabled = useHMSStore(selectIsEffectsEnabled);
  const loadingEffects = useHMSStore(selectAppData(APP_DATA.loadingEffects));
  const hmsActions = useHMSActions();
  const { toggleVideo } = useAVToggle();

  useEffect(() => {
    if (!toggleVideo) {
      VBHandler?.reset();
      hmsActions.setAppData(APP_DATA.background, HMSVirtualBackgroundTypes.NONE);
    }
  }, [hmsActions, toggleVideo]);

  if (!isVideoOn || (!isEffectsEnabled && isSafari) || !isVBEnabled) {
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
