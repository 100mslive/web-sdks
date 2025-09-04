import React, { useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { useMedia } from 'react-use';
import {
  selectIsAllowedToPublish,
  selectLocalPeer,
  selectPeerByID,
  selectVideoTrackByID,
  useHMSStore,
} from '@100mslive/react-sdk';
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
import { useVideoTileContext } from './hooks/useVideoTileLayout';
// @ts-ignore: No implicit Any
import { APP_DATA } from '../common/constants';

const MinimisedTile = ({ setMinimised }: { setMinimised: (value: boolean) => void }) => {
  return (
    <Flex align="center" css={{ gap: '$6', r: '$1', bg: '$surface_default', p: '$4', color: '$on_surface_high' }}>
      <AudioVideoToggle hideOptions={true} />
      <Text>You</Text>
      <IconButton
        className="__cancel-drag-event"
        onClick={() => setMinimised(false)}
        css={{ bg: 'transparent', border: 'transparent' }}
      >
        <ExpandIcon />
      </IconButton>
    </Flex>
  );
};

const insetHeightPx = 180;
const insetMaxWidthPx = 240;
const defaultMobileAspectRatio = 9 / 16;
const desktopAspectRatio = 1 / defaultMobileAspectRatio;

export const InsetTile = ({ peerId }: { peerId?: string }) => {
  const isMobile = useMedia(cssConfig.media.md);
  const isLandscape = useMedia(cssConfig.media.ls);
  const selector = peerId ? selectPeerByID(peerId) : selectLocalPeer;
  const peer = useHMSStore(selector);
  const [minimised, setMinimised] = useSetAppDataByKey(APP_DATA.minimiseInset);
  const videoTrack = useHMSStore(selectVideoTrackByID(peer?.videoTrack));
  const isAllowedToPublish = useHMSStore(selectIsAllowedToPublish);
  const videoTileProps = useVideoTileContext();
  let aspectRatio = isMobile ? defaultMobileAspectRatio : desktopAspectRatio;
  if (videoTrack?.width && videoTrack?.height && !isMobile) {
    aspectRatio = videoTrack.width / videoTrack.height;
  }
  let height = insetHeightPx;
  let width = height * aspectRatio;
  // Convert to 16/9 in landscape mode with a max width of 240
  if (isLandscape && width > insetMaxWidthPx) {
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
    // @ts-expect-error Complex type mismatch
    <Draggable bounds="parent" nodeRef={nodeRef} cancel=".__cancel-drag-event">
      <Box
        ref={nodeRef}
        css={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          zIndex: 10,
          boxShadow: '0 0 8px 0 rgba(0,0,0,0.3)',
          r: '$2',
          ...(!minimised
            ? {
                aspectRatio: `${aspectRatio}`,
                h: height,
              }
            : {}),
        }}
      >
        {minimised ? (
          <MinimisedTile setMinimised={setMinimised} />
        ) : (
          <VideoTile
            peerId={peer?.id}
            trackId={peer?.videoTrack}
            rootCSS={{
              size: '100%',
              padding: 0,
            }}
            width={width}
            height={height}
            containerCSS={{ background: '$surface_default' }}
            canMinimise
            isDragabble
            {...videoTileProps}
            hideParticipantNameOnTile
          />
        )}
      </Box>
    </Draggable>
  );
};
