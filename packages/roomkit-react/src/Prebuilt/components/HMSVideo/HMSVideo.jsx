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
          color: 'white',
          // textShadow: '0px 0px 4px #000',
          whiteSpace: 'pre-line',
          fontSize: '$lg',
          fontStyle: 'normal',
          fontWeight: '$semiBold',
          lineHeight: '$sm',
          letterSpacing: '0.5px',
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
          flex: '1 1 0',
          margin: '0 auto',
          minHeight: '0',
          objectFit: 'contain',
          width: 'inherit',
        }}
        ref={videoRef}
        playsInline
      />
      {children}
    </Flex>
  );
});
