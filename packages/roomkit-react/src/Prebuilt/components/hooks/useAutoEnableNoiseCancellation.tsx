import { useEffect, useRef } from 'react';
import { HMSKrispPlugin } from '@100mslive/hms-noise-cancellation';
import {
  selectIsLocalAudioPluginPresent,
  selectLocalAudioTrackID,
  selectRoom,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';

export const useAutoEnableNoiseCancellation = (plugin: HMSKrispPlugin) => {
  const localPeerAudioTrackID = useHMSStore(selectLocalAudioTrackID);
  const isPluginAdded = useHMSStore(selectIsLocalAudioPluginPresent(plugin.getName()));
  const inProgress = useRef(false);
  const actions = useHMSActions();
  const isNoiseCancellationAllowed = useHMSStore(selectRoom)?.isNoiseCancellationEnabled;

  useEffect(() => {
    if (!isNoiseCancellationAllowed || !localPeerAudioTrackID || inProgress.current || isPluginAdded) {
      return;
    }
    (async () => {
      inProgress.current = true;
      await actions.addPluginToAudioTrack(plugin);
      inProgress.current = false;
    })();
  }, [actions, isNoiseCancellationAllowed, isPluginAdded, plugin, localPeerAudioTrackID]);
};
