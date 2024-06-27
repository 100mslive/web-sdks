import { HMSAudioMode } from '@100mslive/hms-video-store';
import { useHMSActions } from '../primitives/HmsRoomProvider';

export const useAudioMode = () => {
  const hmsActions = useHMSActions();
  const audioTrackSettings = hmsActions.getAudioSettings();
  const isMusicModeEnabled = audioTrackSettings?.audioMode === HMSAudioMode.MUSIC;
  const toggleMusicMode = async () =>
    await hmsActions.setAudioSettings({ audioMode: isMusicModeEnabled ? HMSAudioMode.VOICE : HMSAudioMode.MUSIC });
  return { toggleMusicMode, isMusicModeEnabled };
};
