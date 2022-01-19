import { styled } from '../stitches.config';

export const Root = styled('div', {
  padding: '1rem',
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
});

const Overlay = styled('div', {
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const Info = styled('div', {
  color: '$fg',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  bottom: '10px',
  left: '50%',
  fontSize: '14px',
  transform: 'translateX(-50%)',
  textAlign: 'center',
});

const AvatarContainer = styled('div', {
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translateX(-50%) translateY(-50%)',
});

const HandRaiseBox = styled('div', {
  position: 'absolute',
  left: '20px',
  bottom: '20px',
});

const AudioIndicator = styled('div', {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: '30px',
  color: 'white',
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
  Root: typeof Root;
  Container: typeof Container;
  Overlay: typeof Overlay;
  Info: typeof Info;
  AudioIndicator: typeof AudioIndicator;
  AvatarContainer: typeof AvatarContainer;
  HandRaiseBox: typeof HandRaiseBox;
}

export const StyledVideoTile: VideoTileType = {
  Root,
  Container,
  Overlay,
  Info,
  AudioIndicator,
  AvatarContainer,
  HandRaiseBox,
};
