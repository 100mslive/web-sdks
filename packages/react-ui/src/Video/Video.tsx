import React from 'react';
import { HMSPeer, useVideo } from '@100mslive/react-sdk';
import { styled } from '../stitches.config';
import type { VariantProps } from '@stitches/react';

export const StyledVideo = styled('video', {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '$2',
  objectFit: 'cover',
  variants: {
    mirror: {
      true: {
        transform: 'scaleX(-1)',
      },
    },
    screenShare: {
      true: {
        objectFit: 'contain',
      },
    },
    degraded: {
      // don't show the video when it's degraded so avatar can show on top of it. Video will be stuck frame in this case.
      true: {
        display: 'none',
      },
    },
  },
  defaultVariants: {
    mirror: false,
  },
});

type StyledProps = VariantProps<typeof StyledVideo> & React.ComponentProps<typeof StyledVideo>;

interface Props {
  /**
   * trackID for peer (videoTrack)
   */
  trackId: HMSPeer['videoTrack'];
}

export const Video: React.FC<Props & StyledProps> = ({ trackId, ...props }) => {
  const ref = useVideo(trackId || '');
  return <StyledVideo autoPlay muted playsInline ref={ref} {...props} />;
};

export default Video;
