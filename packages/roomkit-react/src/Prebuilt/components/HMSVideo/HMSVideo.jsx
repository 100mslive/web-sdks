import React, { forwardRef, useEffect, useState } from 'react';
import { Flex } from '../../../Layout';

export const HMSVideo = forwardRef(({ children, isFullScreen, ...props }, videoRef) => {
  const [width, setWidth] = useState('auto');

  useEffect(() => {
    const updatingVideoWidth = () => {
      const videoEl = videoRef.current;
      if (!videoEl) {
        return;
      }
      if (videoEl.videoWidth > videoEl.videoHeight && width !== '100%') {
        setWidth('100%');
      }
    };
    const videoEl = videoRef.current;
    if (!videoEl) {
      return;
    }
    videoEl.addEventListener('loadedmetadata', updatingVideoWidth);
    return () => {
      videoEl.removeEventListener('loadedmetadata', updatingVideoWidth);
    };
  }, [videoRef, width]);
  return (
    <Flex
      data-testid="hms-video"
      css={{
        size: '100%',
        position: 'relative',
        justifyContent: 'center',
        transition: 'all 0.3s ease-in-out',
        '@md': {
          '& video': {
            height: isFullScreen ? '' : '$60 !important',
          },
        },
        '& video::cue': {
          // default for on-surface-high
          color: '#EFF0FA',
          whiteSpace: 'pre-line',
          fontSize: 'sm',
          fontStyle: 'normal',
          fontWeight: '$regular',
          lineHeight: '$sm',
          letterSpacing: '0.25px',
        },
        '& video::-webkit-media-text-track-display': {
          padding: '0 $4',
          boxShadow: '0px 1px 3px 0px #000000A3',
        },
        '& video::-webkit-media-text-track-container': {
          fontSize: '$space$10 !important',
        },
      }}
      direction="column"
      {...props}
    >
      <video
        style={{
          margin: '0 auto',
          objectFit: 'contain',
          width: width,
          height: '100%',
          maxWidth: '100%',
        }}
        ref={videoRef}
        playsInline
        disablePictureInPicture
      />
      {children}
    </Flex>
  );
});
