import React, { forwardRef } from 'react';
import { Box } from '../../../Layout';

export const HMSVideo = forwardRef(({ children, ...props }, videoRef) => {
  return (
    <Box
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
          margin: '0 auto',
          objectFit: 'contain',
          maxWidth: '100%',
          height: '100%',
          '@lg': {
            width: '100%',
            heigth: 'auto',
          },
        }}
        ref={videoRef}
        playsInline
      />
      {children}
    </Box>
  );
});
