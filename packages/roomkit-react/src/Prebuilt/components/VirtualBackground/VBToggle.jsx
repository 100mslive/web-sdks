import React from 'react';
import {
  selectIsLocalVideoEnabled,
  selectIsLocalVideoPluginPresent,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { VirtualBackgroundIcon } from '@100mslive/react-icons';
import { Tooltip } from '../../../Tooltip';
import IconButton from '../../IconButton';
import { GrayscalePlugin } from '../../plugins/GrayscalePlugin';

const grayscale = new GrayscalePlugin();

export const VBToggle = () => {
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);
  const isPluginAdded = useHMSStore(selectIsLocalVideoPluginPresent(grayscale.getName()));
  const hmsActions = useHMSActions();

  const toggleVB = () => {
    if (!isPluginAdded) {
      hmsActions.addPluginToVideoTrack(grayscale);
    } else {
      hmsActions.removePluginFromVideoTrack(grayscale);
    }
  };

  if (!isVideoOn) {
    return null;
  }

  return (
    <Tooltip side="top" title="Enable Grayscale">
      <IconButton active={!isPluginAdded} onClick={toggleVB} data-testid="virtual_bg_btn">
        <VirtualBackgroundIcon />
      </IconButton>
    </Tooltip>
  );
};
