import { Box } from '../Layout';
import { styled } from '../Theme';
import { flexCenter } from '../utils';

export const Root = styled('div', {
  padding: '0.75rem',
});

const Container = styled('div', {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '2',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '$background_default',
  variants: {
    transparentBg: {
      true: {
        background: 'transparent',
      },
    },
    noRadius: {
      true: {
        borderRadius: 0,
      },
    },
  },
});

const Overlay = styled('div', {
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const Info = styled('div', {
  color: 'onPrimary.high',
  position: 'absolute',
  bottom: '5px',
  left: '50%',
  fontSize: 'sm',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  width: '80%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  fontFamily: '$sans',
});

const AttributeBox = styled('div', {
  position: 'absolute',
  top: '4',
  color: 'onSecondary.high',
  bg: 'secondary.dim',
  borderRadius: 'round',
  width: '14',
  height: '14',
  mb: '5px',
  ...flexCenter,
  variants: {
    size: {
      small: {
        width: '10',
        height: '10',
        '& > svg': {
          width: '8',
          height: '8',
        },
      },
      medium: {
        width: '13',
        height: '13',
      },
    },
    position: {
      left: { left: '4' },
      right: { right: '4' },
    },
  },
  defaultVariants: {
    size: 'medium',
    position: 'left',
  },
});

const AudioIndicator = styled(AttributeBox, { defaultVariants: { position: 'right' } });

const FullScreenButton = styled('button', {
  height: '14',
  p: '$2 $4',
  color: 'onSurface.high',
  borderRadius: '1',
  border: 'none',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  top: '2',
  right: '2',
  zIndex: 5,
  '&:not([disabled]):focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px $colors$primary_bright',
  },
});

const AvatarContainer = styled(Box, {
  ...flexCenter,
  flexDirection: 'column',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
  width: '40%',
  height: '40%',
  '& > div': {
    maxHeight: '20',
    height: '100%',
  },
});

interface VideoTileType {
  Root: typeof Root;
  Container: typeof Container;
  Overlay: typeof Overlay;
  Info: typeof Info;
  AvatarContainer: typeof AvatarContainer;
  AttributeBox: typeof AttributeBox;
  AudioIndicator: typeof AudioIndicator;
  FullScreenButton: typeof FullScreenButton;
}

export const StyledVideoTile: VideoTileType = {
  Root,
  Container,
  Overlay,
  Info,
  AvatarContainer,
  AttributeBox,
  AudioIndicator,
  FullScreenButton,
};
