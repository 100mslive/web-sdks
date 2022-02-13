import { Popover as Root, Content, Trigger } from '@radix-ui/react-popover';
import { popoverAnimation } from '../utils/animations';
import { styled } from 'Theme';

const StyledContent = styled(Content, {
  ...popoverAnimation,
});

export const Popover = {
  Root,
  Content: StyledContent,
  Trigger,
};
