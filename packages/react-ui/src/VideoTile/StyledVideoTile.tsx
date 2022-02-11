import { styled } from '../Theme/stitches.config';

export const Root = styled('div', {
  padding: '0.75rem',
  // show videotile context menu on hover
  // [`&:hover .tile-menu`]: {
  //   display: 'inline-block',
  // },
});

const Container = styled('div', {
  width: '100%',
  height: '100%',
  position: 'relative',
  borderRadius: '$2',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: '$grayDark',
  variants: {
    transparentBg: {
      true: {
        background: 'transparent',
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
  color: '$textPrimary',
  position: 'absolute',
  bottom: '5px',
  left: '50%',
  fontSize: '$sm',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  width: '80%',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
});

const AvatarContainer = styled('div', {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
});

const AttributeBox = styled('div', {
  position: 'absolute',
  left: '20px',
  bottom: '20px',
  color: '$textPrimary',
});

const AudioIndicator = styled('div', {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: '20px',
  color: '$textPrimary',
  bg: '$error',
  borderRadius: '$round',
  width: '28px',
  height: '28px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  mb: '5px',
});

const FullScreenButton = styled('button', {
  width: '2.25rem',
  height: '2.25rem',
  color: 'white',
  borderRadius: '$round',
  backgroundColor: '$menuBg',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  bottom: '1rem',
  right: '1rem',
  zIndex: 20,
  '&:not([disabled]):focus': {
    outline: 'none',
    boxShadow: '0 0 0 3px $colors$brandTint',
  },
});

interface VideoTileType {
  Root: typeof Root;
  Container: typeof Container;
  Overlay: typeof Overlay;
  Info: typeof Info;
  AudioIndicator: typeof AudioIndicator;
  AvatarContainer: typeof AvatarContainer;
  AttributeBox: typeof AttributeBox;
  FullScreenButton: typeof FullScreenButton;
}

export const StyledVideoTile: VideoTileType = {
  Root,
  Container,
  Overlay,
  Info,
  AudioIndicator,
  AvatarContainer,
  AttributeBox,
  FullScreenButton,
};
