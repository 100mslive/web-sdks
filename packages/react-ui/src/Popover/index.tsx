import { Popover as Root, Content, Trigger } from '@radix-ui/react-popover';
import { popoverAnimation } from '../utils/animations';
import { styled } from '../Theme';

const StyledContent = styled(Content, {
  padding: '$6',
  borderRadius: '$2',
  backgroundColor: '$bgSecondary',
  boxShadow: '$sm',
  ...popoverAnimation,
});

export const Popover = {
  Root,
  Content: StyledContent,
  Trigger,
};
