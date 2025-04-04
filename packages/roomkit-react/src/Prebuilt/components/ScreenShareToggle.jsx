import React, { Fragment } from 'react';
import { selectIsAllowedToPublish, useAwayNotifications, useHMSStore, useScreenShare } from '@100mslive/react-sdk';
import { ShareScreenIcon } from '@100mslive/react-icons';
import { ShareScreenOptions } from './pdfAnnotator/shareScreenOptions';
import { ToastManager } from './Toast/ToastManager';
import { Box, Flex } from '../../Layout';
import { Tooltip } from '../../Tooltip';
import { ScreenShareButton } from './ShareMenuIcon';
import { useUISettings } from './AppData/useUISettings';
import { isScreenshareSupported } from '../common/utils';
import { UI_SETTINGS } from '../common/constants';

export const ScreenshareToggle = ({ css = {} }) => {
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);

  const {
    amIScreenSharing,
    screenShareVideoTrackId: video,
    toggleScreenShare,
  } = useScreenShare(error => {
    // if user hit cancel, no need to show a toast
    if (error?.name === 'CantAccessCaptureDevice') {
      return;
    }
    ToastManager.addToast({
      title: error.message,
      variant: 'error',
      duration: 2000,
    });
  });
  const { requestPermission } = useAwayNotifications();
  const isVideoScreenshare = amIScreenSharing && !!video;
  if (!isAllowedToPublish.screen || !isScreenshareSupported()) {
    return null;
  }

  return (
    <Fragment>
      <Flex direction="row">
        <ScreenShareButton
          variant="standard"
          key="ShareScreen"
          active={!isVideoScreenshare}
          css={css}
          disabled={isAudioOnly}
          onClick={async () => {
            await toggleScreenShare();
            await requestPermission();
          }}
        >
          <Tooltip title={`${!isVideoScreenshare ? 'Start' : 'Stop'} screen sharing`}>
            <Box>
              <ShareScreenIcon />
            </Box>
          </Tooltip>
        </ScreenShareButton>
        <ShareScreenOptions />
      </Flex>
    </Fragment>
  );
};
