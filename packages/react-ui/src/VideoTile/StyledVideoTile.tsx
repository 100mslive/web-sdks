import { styled } from '../stitches.config';

export const Container = styled('div', {
  position: 'relative',
  borderRadius: '$2',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1rem',
  // show videotile context menu on hover
  // [`&:hover .tile-menu`]: {
  //   display: 'inline-block',
  // },
});

export const Overlay = styled('div', {
  position: 'absolute',
  width: '100%',
  height: '100%',
});

export const Info = styled('div', {
  color: '$fg',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
});

export const AvatarContainer = styled('div', {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
});

const AudioIndicator = styled('div', {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: '50px',
  color: '$fg',
  bg: '$redMain',
  borderRadius: '$round',
  width: '36px',
  height: '36px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  mb: '5px',
});

interface VideoTileType {
  Container: typeof Container;
  Overlay: typeof Overlay;
  Info: typeof Info;
  AudioIndicator: typeof AudioIndicator;
  AvatarContainer: typeof AvatarContainer;
}

export const StyledVideoTile: VideoTileType = {
  Container,
  Overlay,
  Info,
  AudioIndicator,
  AvatarContainer,
};
