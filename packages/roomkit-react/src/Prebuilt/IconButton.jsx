import { IconButton as BaseIconButton } from '../IconButton';
import { styled } from '../Theme';

const IconButton = styled(BaseIconButton, {
  width: '$14',
  height: '$14',
  border: '1px solid $border_bright',
  bg: '$background_dim',
  r: '$1',
  variants: {
    active: {
      true: {
        color: '$on_surface_high',
        backgroundColor: '$transparent',
      },
      false: {
        border: '1px solid transparent',
        color: '$on_primary_high',
      },
    },
    disabled: {
      true: {
        backgroundColor: '$surface_brighter',
        color: '$on_surface_low',
      },
    },
  },
});

export default IconButton;
