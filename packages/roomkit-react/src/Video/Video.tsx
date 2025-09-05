import React from 'react';
import { HMSPeer, useVideo } from '@100mslive/react-sdk';
import type { HTMLStyledProps } from '../Theme';
import { styled } from '../Theme';

export const StyledVideo = styled('video', {
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '2',
  objectFit: 'cover',
  background: '$background_default',
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
    noRadius: {
      true: {
        borderRadius: 0,
      },
    },
  },
  defaultVariants: {
    mirror: false,
  },
});

type StyledProps = HTMLStyledProps<typeof StyledVideo>;

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
}

export const Video: React.FC<Props & StyledProps> = ({ trackId, attach, ...props }) => {
  const { videoRef } = useVideo({ trackId, attach });
  return <StyledVideo ref={videoRef} {...props} />;
};
