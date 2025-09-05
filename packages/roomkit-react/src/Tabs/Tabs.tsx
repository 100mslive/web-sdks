import * as TabsPrimitive from '@radix-ui/react-tabs';
import { styled } from '../Theme';

const StyledTabsRoot = styled(TabsPrimitive.Root, {
  display: 'flex',
});

const StyledList = styled(TabsPrimitive.List, {
  flexShrink: 0,
  display: 'flex',
});

const StyledTrigger = styled(TabsPrimitive.Trigger, {
  all: 'unset',
  fontFamily: '$sans',
  p: '8',
  display: 'flex',
  alignItems: 'center',
  fontSize: 'sm',
  lineHeight: '$sm',
  color: 'onSurface.high',
  userSelect: 'none',
  cursor: 'pointer',
  '&[data-state="active"]': {
    bg: 'surface.brighter',
    r: '1',
  },
});

const StyledContent = styled(TabsPrimitive.Content, {
  flex: '1 1 0',
  padding: '10',
  outline: 'none',
});

export const Tabs = {
  Root: StyledTabsRoot,
  List: StyledList,
  Content: StyledContent,
  Trigger: StyledTrigger,
};
