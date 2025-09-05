import { IconButton as BaseIconButton } from '../IconButton';
import { styled } from '../Theme';

const IconButton = styled(BaseIconButton, {
  width: '14',
  height: '14',
  border: '1px solid $border_bright',
  bg: 'background.dim',
  r: '1',
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: 'secondary.dim',
    color: 'onPrimary.high',
  },
  variants: {
    active: {
      true: {
        color: 'onSurface.high',
        backgroundColor: 'transparent',
      },
    },
  },
});

export default IconButton;
