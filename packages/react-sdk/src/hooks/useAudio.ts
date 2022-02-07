import { HMSTrackID, selectAudioTrackVolume } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';
import { useCallback } from 'react';

/**
 * This hook can be used to implement an audio level changer on tile level.
 * @param trackId of the track whose volume is needed
 */
export const useAudio = (trackId: HMSTrackID) => {
  const actions = useHMSActions();
  const volume = useHMSStore(selectAudioTrackVolume(trackId));

  const setVolume = useCallback(
    (volume: number) => {
      actions.setVolume(volume, trackId);
    },
    [actions],
  );

  return { volume, setVolume };
};
