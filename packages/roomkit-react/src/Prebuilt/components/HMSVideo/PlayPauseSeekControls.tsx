import React from 'react';
import { useMedia } from 'react-use';
import { BackwardArrowIcon, ForwardArrowIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../../Layout';
import { Text } from '../../../Text';
import { config } from '../../../Theme';
import { PlayPauseButton } from './PlayPauseButton';
import { SeekControl } from './SeekControl';
import { useIsLandscape } from '../../common/hooks';

// desktop buttons
export const PlayPauseSeekControls = ({
  isPaused,
  onSeekTo,
}: {
  isPaused: boolean;
  onSeekTo: (value: number) => void;
}) => {
  return (
    <>
      <SeekControl
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onSeekTo(-10);
        }}
        title="backward"
      >
        <BackwardArrowIcon width={20} height={20} />
      </SeekControl>
      <PlayPauseButton isPaused={isPaused} />
      <SeekControl
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onSeekTo(10);
        }}
        title="forward"
      >
        <ForwardArrowIcon width={20} height={20} />
      </SeekControl>
    </>
  );
};

// overlay handlers
export const PlayPauseSeekOverlayControls = ({
  isPaused,
  showControls,
  hoverControlsVisible,
}: {
  isPaused: boolean;
  showControls: boolean;
  hoverControlsVisible: {
    seekBackward: boolean;
    seekForward: boolean;
    pausePlay: boolean;
  };
}) => {
  const isMobile = useMedia(config.media.md);
  const isLandscape = useIsLandscape();

  if (!isMobile && !isLandscape) {
    // show desktopOverflow icons
    return (
      <>
        <Flex
          css={{
            bg: 'rgba(0, 0, 0, 0.6)',
            r: 'round',
            size: '24',
            visibility: hoverControlsVisible.seekBackward ? `` : `hidden`,
            opacity: hoverControlsVisible.seekBackward ? `1` : '0',
          }}
          direction="column"
          align="center"
        >
          <SeekControl title="backward">
            <BackwardArrowIcon width={52} height={52} />
          </SeekControl>
          <Text variant="body2" css={{ fontWeight: 'regular' }}>
            10 secs
          </Text>
        </Flex>
        <Box
          css={{
            bg: 'rgba(0, 0, 0, 0.6)',
            r: 'round',
            visibility: hoverControlsVisible.pausePlay ? `` : `hidden`,
            opacity: hoverControlsVisible.pausePlay ? `1` : '0',
          }}
        >
          <PlayPauseButton isPaused={isPaused} width={48} height={48} />
        </Box>
        <Flex
          css={{
            bg: 'rgba(0, 0, 0, 0.6)',
            r: 'round',
            size: '24',
            visibility: hoverControlsVisible.seekForward ? `` : `hidden`,
            opacity: hoverControlsVisible.seekForward ? `1` : '0',
          }}
          direction="column"
          align="center"
        >
          <SeekControl title="forward">
            <ForwardArrowIcon width={52} height={52} />
          </SeekControl>
          <Text variant="body2" css={{ fontWeight: 'regular' }}>
            10 secs
          </Text>
        </Flex>
      </>
    );
  }

  return (
    <Flex
      align="center"
      justify="center"
      css={{
        position: 'absolute',
        bg: '#00000066',
        display: 'inline-flex',
        gap: '2',
        zIndex: 1,
        size: '100%',
        visibility: showControls ? `` : `hidden`,
        opacity: showControls ? `1` : '0',
      }}
    >
      <SeekControl
        title="backward"
        css={{
          visibility: hoverControlsVisible.seekBackward ? `` : `hidden`,
          opacity: hoverControlsVisible.seekBackward ? `1` : '0',
        }}
      >
        <BackwardArrowIcon width={32} height={32} />
      </SeekControl>
      <Box
        css={{
          bg: 'rgba(0, 0, 0, 0.6)',
          r: 'round',
        }}
      >
        <PlayPauseButton isPaused={isPaused} width={48} height={48} />
      </Box>
      <SeekControl
        title="forward"
        css={{
          visibility: hoverControlsVisible.seekForward ? `` : `hidden`,
          opacity: hoverControlsVisible.seekForward ? `1` : '0',
        }}
      >
        <ForwardArrowIcon width={32} height={32} />
      </SeekControl>
    </Flex>
  );
};
