import { IconButton as BaseIconButton } from '../IconButton';
import { styled } from '../Theme';

const IconButton = styled(BaseIconButton, {
  width: '$14',
  height: '$14',
  border: '1px solid $borderLight',
  r: '$1',
  variants: {
    active: {
      false: {
        border: '1px solid transparent',
        color: '$white',
      },
    },
  },
});

export default IconButton;
