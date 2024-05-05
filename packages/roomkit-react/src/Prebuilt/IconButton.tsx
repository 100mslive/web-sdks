import { IconButton as BaseIconButton } from '../IconButton';
import { styled } from '../Theme';

const IconButton = styled(BaseIconButton, {
  width: '$14',
  height: '$14',
  border: '1px solid $border_bright',
  bg: '$background_dim',
  r: '$1',
  '&[disabled]': {
    opacity: 0.5,
    cursor: 'not-allowed',
    backgroundColor: '$secondary_dim',
    color: '$on_primary_high',
  },
  variants: {
    active: {
      true: {
        color: '$on_surface_high',
        backgroundColor: 'transparent',
      },
    },
  },
});

export default IconButton;
