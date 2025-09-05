import { styled } from '../../Theme';
import IconButton from '../IconButton';

export const ScreenShareButton = styled(IconButton, {
  h: '14',
  px: '8',
  r: '1',
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  '@md': {
    px: '4',
    mx: 0,
  },
});

export const ShareMenuIcon = styled(ScreenShareButton, {
  borderTopLeftRadius: 0,
  borderBottomLeftRadius: 0,
  borderTopRightRadius: '$1',
  borderBottomRightRadius: '$1',
  borderLeftWidth: 0,
  w: '4',
  '@md': {
    w: 'unset',
    px: '2',
  },
});
