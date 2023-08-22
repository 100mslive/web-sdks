import { styled } from '../Theme';

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
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
});

const View = styled('div', {
  height: '100%',
  width: '100%',
  position: 'absolute',
  display: 'flex',
  placeContent: 'center',
  flexWrap: 'wrap',
  alignItems: 'center',
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
