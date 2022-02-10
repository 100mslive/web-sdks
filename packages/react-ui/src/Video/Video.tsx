import React from 'react';
import { HMSPeer, useVideo } from '@100mslive/react-sdk';
import { styled } from '../Theme/stitches.config';
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
  /**
   * flips the video if local peer rendered
   */
  mirror: HMSPeer['isLocal'];
}

export const Video: React.FC<Props & StyledProps> = ({ trackId, mirror, ...props }) => {
  const ref = useVideo(trackId || '');
  return <StyledVideo mirror={mirror} autoPlay muted playsInline ref={ref} {...props} />;
};

export default Video;
