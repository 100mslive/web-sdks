import { styled } from '../stitches.config';

const Root = styled('div', {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const Container = styled('div', {
  height: '100%',
  width: '100%',
  position: 'relative',
  padding: '$5',
  overflowX: 'hidden',
  display: 'flex',
  alignItems: 'center',
});

const View = styled('div', {
  position: 'absolute',
  display: 'flex',
  placeContent: 'center',
  flexWrap: 'wrap',
  alignItems: 'center',
  width: '100%',
  height: '100%',
});

interface VideoListType {
  Root: typeof Root;
  Container: typeof Container;
  View: typeof View;
}

export const StyledVideoList: VideoListType = {
  Root,
  Container,
  View,
};
