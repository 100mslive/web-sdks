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
  attach?: boolean;
}

export const Video: React.FC<Props & StyledProps> = React.forwardRef<HTMLVideoElement, Props & StyledProps>(
  ({ trackId, attach, ...props }, forwardRef) => {
    const { videoRef } = useVideo({ trackId, attach });
    return (
      <StyledVideo
        {...props}
        autoPlay
        muted
        playsInline
        controls={false}
        ref={node => {
          videoRef(node);
          if (typeof forwardRef === 'function') {
            forwardRef(node);
          } else if (forwardRef) {
            forwardRef.current = node;
          }
        }}
      />
    );
  },
);

export default Video;
