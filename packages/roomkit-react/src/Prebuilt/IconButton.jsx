import { IconButton as BaseIconButton } from '../IconButton';
import { styled } from '../Theme';

const IconButton = styled(BaseIconButton, {
  width: '$14',
  height: '$14',
  border: '1px solid $border_bright',
  cursor: 'pointer',
  r: '$1',
  variants: {
    active: {
      false: {
        border: '1px solid transparent',
        color: '$on_primary_high',
      },
    },
  },
});

export default IconButton;
