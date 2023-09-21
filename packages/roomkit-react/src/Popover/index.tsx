import { Arrow, Close, Content, Popover as Root, Portal, Trigger } from '@radix-ui/react-popover';
import { styled } from '../Theme';
import { popoverAnimation } from '../utils/animations';

const StyledContent = styled(Content, {
  padding: '$6',
  borderRadius: '$2',
  backgroundColor: '$background_default',
  boxShadow: '$sm',
  zIndex: 12,
  ...popoverAnimation,
});

const StyledArrow = styled(Arrow, {
  ...popoverAnimation,
});

const StyledTrigger = styled(Trigger, {});

export const Popover = {
  Root,
  Content: StyledContent,
  Trigger: StyledTrigger,
  Portal: Portal,
  Arrow: StyledArrow,
  Close: Close,
};
