import { Popover as Root, Content, Trigger, Arrow } from '@radix-ui/react-popover';
import { popoverAnimation } from '../utils/animations';
import { styled } from '../Theme';

const StyledRoot = styled(Root, {});

const StyledTrigger = styled(Trigger, {});

const StyledContent = styled(Content, {
  padding: '$6',
  borderRadius: '$2',
  backgroundColor: '$bgSecondary',
  boxShadow: '$sm',
  ...popoverAnimation,
});

const StyledArrow = styled(Arrow, {
  ...popoverAnimation,
});

export const Popover = {
  Root: StyledRoot,
  Content: StyledContent,
  Trigger: StyledTrigger,
  Arrow: StyledArrow,
};
