import { HMSAudioMode, selectLocalMediaSettings } from '@100mslive/hms-video-store';
import { useHMSActions, useHMSStore } from '../primitives/HmsRoomProvider';

export const useAudioMode = () => {
  const hmsActions = useHMSActions();
  const { audioMode } = useHMSStore(selectLocalMediaSettings);
  const isMusicModeEnabled = audioMode === HMSAudioMode.MUSIC;
  const toggleMusicMode = async () =>
    await hmsActions.setAudioSettings({ audioMode: isMusicModeEnabled ? HMSAudioMode.VOICE : HMSAudioMode.MUSIC });
  return { toggleMusicMode, isMusicModeEnabled };
};
