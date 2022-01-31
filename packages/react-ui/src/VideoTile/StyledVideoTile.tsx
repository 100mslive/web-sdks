import { styled } from '../stitches.config';

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
});

const Overlay = styled('div', {
  position: 'absolute',
  width: '100%',
  height: '100%',
});

const Info = styled('div', {
  color: '$fg',
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
  color: '$fg',
});

const AudioIndicator = styled('div', {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  bottom: '20px',
  color: 'white',
  bg: '$redMain',
  borderRadius: '$round',
  width: '28px',
  height: '28px',
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
  AttributeBox: typeof AttributeBox;
}

export const StyledVideoTile: VideoTileType = {
  Root,
  Container,
  Overlay,
  Info,
  AudioIndicator,
  AvatarContainer,
  AttributeBox: AttributeBox,
};
