import React from 'react';
import { HMSPeer, useVideo } from '@100mslive/react-sdk';
import { styled } from '../Theme';
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
      // send the video behind when it's degraded so avatar can show on top of it. Video will be stuck frame in this case.
      // not hiding by using display none, because it will lead it to be detached as it will no longer be in view.
      true: {
        zIndex: -100,
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
   * Boolean stating whether to override the internal behaviour.
   * when attach is false, even if tile is inView or enabled, it won't be rendered
   */
  attach?: boolean;
  /**
   * Number between 0 and 1 indication when the element is considered inView
   */
  threshold?: number;
}

export const Video: React.FC<Props & StyledProps> = ({ trackId, attach, threshold, ...props }) => {
  const { videoRef } = useVideo({ trackId, attach, threshold });
  return <StyledVideo autoPlay muted playsInline controls={false} ref={videoRef} {...props} />;
};

export default Video;
