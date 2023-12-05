import React, { forwardRef } from 'react';
import { Flex } from '../../../';

export const HMSVideo = forwardRef(({ children, ...props }, videoRef) => {
  return (
    <Flex
      data-testid="hms-video"
      css={{
        size: '100%',
        position: 'relative',
        '& video::cue': {
          backgroundColor: '#000',
          color: 'white',
          opacity: 0.75,
          textShadow: '0px 0px 4px #000',
          whiteSpace: 'pre-line',
          fontSize: '$lg',
          fontStyle: 'normal',
          fontWeight: '$semiBold',
          lineHeight: '$sm',
          letterSpacing: '0.5px',
          backgroundClip: 'text',
          '-webkit-background-clip': 'text',
        },
        '& video::-webkit-media-text-track-display-backdrop': {
          backgroundColor: '#000',
          opacity: 0.75,
          maxWidth: '50%',
        },
      }}
      direction="column"
      {...props}
    >
      <video
        style={{
          flex: '1 1 0',
          margin: '0 auto',
          minHeight: '0',
        }}
        ref={videoRef}
        playsInline
      />
      {children}
    </Flex>
  );
});
