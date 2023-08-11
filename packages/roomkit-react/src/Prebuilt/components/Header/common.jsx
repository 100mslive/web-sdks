import {
  selectIsLocalVideoEnabled,
  selectLocalVideoTrackID,
  selectVideoTrackByID,
  useDevices,
  useHMSActions,
  useHMSStore,
} from '@100mslive/react-sdk';
import { CameraFlipIcon, SpeakerIcon } from '@100mslive/react-icons';
import { Box } from '../../../Layout';
import IconButton from '../../IconButton';
import { ToastManager } from '../Toast/ToastManager';

export const CamaraFlipActions = () => {
  const actions = useHMSActions();
  const { allDevices } = useDevices();
  const { videoInput } = allDevices;
  const isVideoOn = useHMSStore(selectIsLocalVideoEnabled);

  const videoTrackId = useHMSStore(selectLocalVideoTrackID);
  const localVideoTrack = useHMSStore(selectVideoTrackByID(videoTrackId));

  return (
    <Box>
      <IconButton
        disabled={!videoInput?.length || !isVideoOn || !localVideoTrack?.facingMode}
        onClick={async () => {
          try {
            await actions.switchCamera();
          } catch (e) {
            ToastManager.addToast({
              title: `Error while flipping camera ${e.message || ''}`,
              variant: 'error',
            });
          }
        }}
      >
        <CameraFlipIcon />
      </IconButton>
    </Box>
  );
};

export const AudioOutputActions = ({ disabled = false }) => {
  const { allDevices } = useDevices();
  const { audioOutput } = allDevices;
  // don't show speaker selector where the API is not supported, and use
  // a generic word("Audio") for Mic. In some cases(Chrome Android for e.g.) this changes both mic and speaker keeping them in sync.
  const shouldShowAudioOutput = 'setSinkId' in HTMLMediaElement.prototype;

  /**
   * Chromium browsers return an audioOutput with empty label when no permissions are given
   */
  const audioOutputFiltered = audioOutput?.filter(item => !!item.label) ?? [];
  if (!shouldShowAudioOutput || !audioOutputFiltered?.length > 0) {
    return null;
  }
  return (
    <Box>
      <IconButton
        disabled={disabled}
        onClick={async () => {
          try {
            // TODO add audio out bottomsheet once integrated with bottomsheet pr
          } catch (e) {
            ToastManager.addToast({
              title: `Error while changin audio output ${e.message || ''}`,
              variant: 'error',
            });
          }
        }}
      >
        <SpeakerIcon />
      </IconButton>
    </Box>
  );
};
