import React, { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { useMedia } from 'react-use';
import { selectIsAllowedToPublish, selectLocalPeer, selectVideoTrackByID, useHMSStore } from '@100mslive/react-sdk';
import { ExpandIcon } from '@100mslive/react-icons';
import { Box, Flex } from '../../Layout';
import { Text } from '../../Text';
import { config as cssConfig } from '../../Theme';
// @ts-ignore: No implicit Any
import IconButton from '../IconButton';
// @ts-ignore: No implicit Any
import { AudioVideoToggle } from './AudioVideoToggle';
// @ts-ignore: No implicit Any
import VideoTile from './VideoTile';
// @ts-ignore: No implicit Any
import { useSetAppDataByKey } from './AppData/useUISettings';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../common/constants';

const MinimisedTile = ({ setMinimised }: { setMinimised: (value: boolean) => void }) => {
  return (
    <Flex align="center" css={{ gap: '$6', r: '$1', bg: '$surface_default', p: '$4', color: '$on_surface_high' }}>
      <AudioVideoToggle hideOptions={true} />
      <Text>You</Text>
      <IconButton onClick={() => setMinimised(false)} css={{ bg: 'transparent', border: 'transparent' }}>
        <ExpandIcon />
      </IconButton>
    </Flex>
  );
};

export const InsetTile = () => {
  const isMobile = useMedia(cssConfig.media.md);
  const isLandscape = useMedia(cssConfig.media.ls);
  const localPeer = useHMSStore(selectLocalPeer);
  const [minimised, setMinimised] = useSetAppDataByKey(APP_DATA.minimiseInset);
  const videoTrack = useHMSStore(selectVideoTrackByID(localPeer?.videoTrack));
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const aspectRatio = (videoTrack?.width || (isMobile ? 9 : 16)) / (videoTrack?.height || (isMobile ? 16 : 9));
  let height = 180;
  let width = height * aspectRatio;
  if (isLandscape && width > 240) {
    width = 240;
    height = width / aspectRatio;
  }

  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || !window.ResizeObserver) {
      return;
    }
    const resizeObserver = new ResizeObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === node.parentElement) {
          // reset to original position on resize
          node.style.transform = `translate(0,0)`;
        }
      });
    });
    node.parentElement && resizeObserver.observe(node.parentElement);
    return () => {
      node?.parentElement && resizeObserver?.unobserve(node.parentElement);
      resizeObserver?.disconnect();
    };
  }, []);

  if (!isAllowedToPublish.video && !isAllowedToPublish.audio) {
    return null;
  }

  return (
    <Draggable bounds="parent" nodeRef={nodeRef}>
      <Box
        ref={nodeRef}
        css={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          zIndex: 20,
          boxShadow: '0 0 8px 0 rgba(0,0,0,0.3)',
          r: '$2',
          ...(!minimised
            ? {
                aspectRatio: aspectRatio,
                h: height,
              }
            : {}),
        }}
      >
        {minimised ? (
          <MinimisedTile setMinimised={setMinimised} />
        ) : (
          <VideoTile
            peerId={localPeer?.id}
            trackid={localPeer?.videoTrack}
            rootCSS={{
              size: '100%',
              padding: 0,
            }}
            width={width}
            height={height}
            containerCSS={{ background: '$surface_default' }}
            canMinimise
          />
        )}
      </Box>
    </Draggable>
  );
};
