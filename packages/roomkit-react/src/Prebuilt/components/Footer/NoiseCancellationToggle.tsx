import React, { useEffect, useRef, useState } from 'react';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';
import {
  selectIsLocalAudioPluginPresent,
  selectLocalAudioTrackID,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { AudioLevelIcon } from '@100mslive/react-icons';
import { IconButton } from '../../../IconButton';

export const NoiseCancellationToggle = () => {
  const pluginRef = useRef(new HMSKrispPlugin());
  const localPeerAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const isPluginAdded = useHMSStore(selectIsLocalAudioPluginPresent(pluginRef.current.getName()));
  const [active, setActive] = useState(false);
  const actions = useHMSActions();

  useEffect(() => {
    if (localPeerAudioTrackID && !isPluginAdded) {
      actions.addPluginToAudioTrack(pluginRef.current);
    }
  }, [localPeerAudioTrackID, actions, isPluginAdded]);

  return (
    <IconButton
      active={active}
      onClick={() => {
        pluginRef.current.toggle();
        setActive(!pluginRef.current.isEnabled());
      }}
      data-testid="noise_cancellation_btn"
    >
      <AudioLevelIcon />
    </IconButton>
  );
};
