import React, { Fragment } from 'react';
import {
  selectIsAllowedToPublish,
  useHMSStore,
  useScreenShare,
} from '@100mslive/react-sdk';
import { ShareScreenIcon } from '@100mslive/react-icons';
import { useUISettings } from './AppData/useUISettings';
import { ShareScreenOptions } from './pdfAnnotator/shareScreenOptions';
import { ScreenShareButton } from './ShareMenuIcon';
import { Box, Flex, Tooltip } from '../../';
import { UI_SETTINGS } from '../common/constants';
import { isScreenshareSupported } from '../common/utils';

export const ScreenshareToggle = ({ css = {} }) => {
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);

  const {
    amIScreenSharing,
    screenShareVideoTrackId: video,
    toggleScreenShare,
  } = useScreenShare();
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
          onClick={() => {
            toggleScreenShare();
          }}
        >
          <Tooltip
            title={`${!isVideoScreenshare ? 'Start' : 'Stop'} screen sharing`}
          >
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


