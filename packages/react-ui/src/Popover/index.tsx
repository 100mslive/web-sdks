import { Popover as Root, Content, Trigger, Arrow, Portal } from '@radix-ui/react-popover';
import { popoverAnimation } from '../utils/animations';
import { styled } from '../Theme';

const StyledContent = styled(Content, {
  padding: '$6',
  borderRadius: '$2',
  backgroundColor: '$bgSecondary',
  boxShadow: '$sm',
  zIndex: 12,
  ...popoverAnimation,
});

const StyledArrow = styled(Arrow, {
  ...popoverAnimation,
});

const StyledTrigger = styled(Trigger, {})


export const Popover = {
  Root,
  Content: StyledContent,
  Trigger: StyledTrigger,
  Portal: Portal,
  Arrow: StyledArrow,
};
