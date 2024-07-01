import React, { useState } from 'react';
import { selectLocalPeerID, useHMSStore, useScreenShare } from '@100mslive/react-sdk';
import { ChevronDownIcon, ChevronUpIcon, MusicIcon, ShareScreenIcon, VideoPlayerIcon } from '@100mslive/react-icons';
import { Box, Dropdown, Flex, Text, Tooltip } from '../../../';
import { useUISettings } from '../AppData/useUISettings';
import { useScreenshareAudio } from '../hooks/useScreenshareAudio';
import { UI_SETTINGS } from '../../common/constants';

export const getRecordingText = ({ isBrowserRecordingOn, isServerRecordingOn, isHLSRecordingOn }, delimiter = ', ') => {
  if (!isBrowserRecordingOn && !isServerRecordingOn && !isHLSRecordingOn) {
    return '';
  }
  const title = [];
  if (isBrowserRecordingOn) {
    title.push('Browser');
  }
  if (isServerRecordingOn) {
    title.push('Server');
  }
  if (isHLSRecordingOn) {
    title.push('HLS');
  }
  return title.join(delimiter);
};

/**
 * Display state of recording, streaming, playlist, whiteboard
 */
export const AdditionalRoomState = () => {
  const isAudioOnly = useUISettings(UI_SETTINGS.isAudioOnly);
  const screenshareAudio = useScreenshareAudio();
  const [open, setOpen] = useState(false);
  const isAudioshareInactive = [
    !screenshareAudio.peer || !screenshareAudio.track,
    !screenshareAudio.peer?.isLocal && !screenshareAudio.track?.enabled,
  ].some(Boolean);

  const localPeerID = useHMSStore(selectLocalPeerID);
  const { screenSharingPeerName, screenSharingPeerId, screenShareVideoTrackId } = useScreenShare();

  const isVideoScreenSharingOn = !!screenShareVideoTrackId;
  const shouldShowScreenShareState = isAudioOnly && isVideoScreenSharingOn;
  const shouldShowVideoState = isAudioOnly;
  if (isAudioshareInactive && !shouldShowScreenShareState && !shouldShowVideoState) {
    return null;
  }

  return (
    <Dropdown.Root open={open} onOpenChange={setOpen}>
      <Dropdown.Trigger asChild>
        <Flex
          align="center"
          css={{
            color: '$on_primary_high',
            borderRadius: '$1',
            border: '1px solid $on_surface_low',
            padding: '$4',
            '@sm': { display: 'none' },
          }}
          data-testid="record_status_dropdown"
        >
          {!isAudioshareInactive && (
            <Tooltip title="Screenshare Audio">
              <Flex align="center" css={{ color: '$on_primary_high', mx: '$2' }}>
                <MusicIcon width={24} height={24} />
              </Flex>
            </Tooltip>
          )}
          {shouldShowScreenShareState && (
            <Tooltip title="Screenshare">
              <Flex align="center" css={{ color: '$on_primary_high', mx: '$2' }}>
                <ShareScreenIcon width={24} height={24} />
              </Flex>
            </Tooltip>
          )}
          {shouldShowVideoState && (
            <Tooltip title="video playlist">
              <Flex align="center" css={{ color: '$on_primary_high', mx: '$2' }}>
                <VideoPlayerIcon width={24} height={24} />
              </Flex>
            </Tooltip>
          )}
          <Box css={{ '@lg': { display: 'none' }, color: '$on_surface_low' }}>
            {open ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </Box>
        </Flex>
      </Dropdown.Trigger>
      <Dropdown.Content sideOffset={5} align="end" css={{ w: '$60' }}>
        {!isAudioshareInactive && (
          <Dropdown.Item css={{ color: '$on_primary_high' }}>
            <MusicIcon width={24} height={24} />
            <Text variant="sm" css={{ ml: '$2', flex: '1 1 0' }}>
              Music is playing
            </Text>
            <Text
              variant="sm"
              css={{ color: '$alert_error_default', ml: '$2', cursor: 'pointer' }}
              onClick={e => {
                e.preventDefault();
                screenshareAudio.onToggle();
              }}
            >
              {screenshareAudio.muted ? 'Unmute' : 'Mute'}
            </Text>
          </Dropdown.Item>
        )}
        {shouldShowScreenShareState && (
          <Dropdown.Item css={{ color: '$on_primary_high' }}>
            <ShareScreenIcon width={24} height={24} />
            <Text variant="sm" css={{ ml: '$2', flex: '1 1 0' }}>
              {`Shared by: ${screenSharingPeerId === localPeerID ? 'You' : screenSharingPeerName}`}
            </Text>
          </Dropdown.Item>
        )}
      </Dropdown.Content>
    </Dropdown.Root>
  );
};
